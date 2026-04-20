import { GoogleGenerativeAI } from '@google/generative-ai';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const safeParseJSON = (raw) => {
  try {
    let text = raw.trim();
    // 1. Remove markdown fences if present
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    
    // 2. Extract first { to last } to ignore any "Sure! Here is the JSON" conversational text
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      text = text.substring(startIdx, endIdx + 1);
    }
    
    return JSON.parse(text);
  } catch (err) {
    console.error('[JSON Parse Error] Raw text was:', raw.substring(0, 100));
    throw new Error('AI returned an invalid response format. Auto-retrying...');
  }
};

/**
 * Universal FREE AI Requester
 * Silently handles fallbacks between Groq and Gemini
 */
export const requestAI = async (prompt, systemPrompt = "You are a helpful assistant.", jsonMode = false) => {
  // 1. Try Groq (Free, Fast, Reliable)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt + (jsonMode ? " IMPORTANT: Return ONLY valid JSON." : " Speak naturally as a helpful human assistant.") },
            { role: 'user', content: prompt }
          ],
          response_format: jsonMode ? { type: "json_object" } : undefined,
          temperature: jsonMode ? 0.1 : 0.7
        })
      });
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
    } catch (e) { console.warn('[AI] Groq failed, trying Gemini...'); }
  }

  // 2. Try Gemini (Free/Pro)
  const geminiKey = process.env.VITE_GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(systemPrompt + '\n\n' + prompt);
      const text = await result.response.text();
      console.log('[AI] Response via Gemini');
      return text;
    } catch (e) {
      console.error('[AI] Gemini failed:', e.message);
    }
  }

  throw new Error('All AI providers failed or no API keys found in .env');
};

// JSON helper at top is sufficient.

export const runBatchPerceptionEngine = async (products) => {
  const productsList = products.map((p, idx) =>
    `--- PRODUCT ${idx + 1} (id: ${p.id}) ---
Title: ${p.title}
Description: ${(p.description || 'None').substring(0, 300)}
Price: ${p.price}
Variants: ${p.variants || 'None'}
Vendor: ${p.vendor || 'Unknown'}
Tags: ${p.tags || 'None'}`
  ).join('\n\n');

  const prompt = `Analyze each of the following ${products.length} Shopify products.
${productsList}`;

  const system = `You are a product data analyst API. Return ONLY a valid JSON array with exactly ${products.length} objects.
Schema:
[
  {
    "id": "product_id_here",
    "summary": "1-2 sentence professional analysis",
    "missing_info": ["missing attribute 1"],
    "ambiguities": ["unclear phrase"],
    "confidence_score": 75,
    "seo_score": 68,
    "trust_signals": { "reviews_present": false, "policies_present": false }
  }
]`;

  try {
    const text = await requestAI(prompt, system, true);
    const parsed = safeParseJSON(text);
    const resultMap = {};
    if (Array.isArray(parsed)) {
      parsed.forEach((item, idx) => {
        const id = item.id || products[idx]?.id;
        if (id) resultMap[String(id)] = item;
      });
    }
    return resultMap;
  } catch (err) {
    console.error('[AI] Batch error:', err.message);
    return {};
  }
};

export const runAutoFix = async (product, issues, retryCount = 0) => {
  const prompt = `Rewrite this Shopify product listing.
  ORIGINAL:
  Title: ${product.title}
  Description: ${(product.description || 'No description').substring(0, 500)}
  ISSUES: ${JSON.stringify(issues)}`;

  const system = `You are a professional SEO copywriter. 
  STRICT FORMATTING:
  1. Catchy 15-word intro in <b>...</b>.
  2. "Key Highlights" bulleted list (<ul>/<li>).
  3. "Ideal For" section.
  Return ONLY JSON:
  {
    "fixed_title": "title",
    "fixed_description": "HTML...",
    "seo_keywords": ["kw1", "kw2"],
    "confidence": 95
  }`;

  try {
    const text = await requestAI(prompt, system, true);
    return safeParseJSON(text);
  } catch (err) {
    if (err.message?.includes('429') && retryCount < 2) {
      await new Promise(r => setTimeout(r, 10000));
      return runAutoFix(product, issues, retryCount + 1);
    }
    throw err;
  }
};
