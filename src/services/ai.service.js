import { GoogleGenerativeAI } from '@google/generative-ai';

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GEM_MODEL  = 'gemini-1.5-flash'; // generous free tier: 15 RPM / 1M tokens/day

// ─── JSON Cleaner ──────────────────────────────────────────────────────────────
const safeParseJSON = (raw) => {
  try {
    let text = raw.trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Extract first { ... } block in case model prefixes with "Sure, here is..."
    const s = text.indexOf('{'), e = text.lastIndexOf('}');
    if (s !== -1 && e !== -1) text = text.substring(s, e + 1);

    return JSON.parse(text);
  } catch {
    throw new Error('AI returned non-JSON. Retrying with fallback provider...');
  }
};

// ─── Core Requester (Groq → Gemini cascade) ───────────────────────────────────
export const requestAI = async (prompt, systemPrompt = 'You are a helpful assistant.', jsonMode = false) => {

  // ── 1. Try Groq ──────────────────────────────────────────────────────────────
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt + (jsonMode ? ' IMPORTANT: Reply with ONLY valid JSON, no prose.' : '') },
            { role: 'user',   content: prompt }
          ],
          response_format: jsonMode ? { type: 'json_object' } : undefined,
          temperature: jsonMode ? 0.1 : 0.7,
          max_tokens: 2048
        })
      });

      const data = await res.json();

      if (res.status === 429) {
        console.warn('[AI] Groq quota hit — switching to Gemini fallback...');
      } else if (!res.ok) {
        console.warn('[AI] Groq error:', data.error?.message || res.status);
      } else if (data.choices?.[0]?.message?.content) {
        console.log('[AI] ✅ Groq responded');
        return data.choices[0].message.content;
      }
    } catch (e) {
      console.warn('[AI] Groq network error:', e.message);
    }
  }

  // ── 2. Fallback: Gemini 1.5 Flash (most generous free quota) ─────────────────
  const gemKey = process.env.VITE_GEMINI_API_KEY;
  if (gemKey) {
    try {
      const genAI = new GoogleGenerativeAI(gemKey);
      const model = genAI.getGenerativeModel({ model: GEM_MODEL });
      const fullPrompt = jsonMode
        ? `${systemPrompt}\n\nIMPORTANT: Return ONLY valid JSON.\n\nUser: ${prompt}`
        : `${systemPrompt}\n\nUser: ${prompt}`;
      const result = await model.generateContent(fullPrompt);
      const text = await result.response.text();
      console.log('[AI] ✅ Gemini Flash responded (fallback)');
      return text;
    } catch (e) {
      console.warn('[AI] Gemini fallback error:', e.message);
    }
  }

  throw new Error('Both Groq and Gemini APIs are unavailable. Check your API keys in .env');
};

// ─── Batch Product Perception ──────────────────────────────────────────────────
export const runBatchPerceptionEngine = async (products) => {
  const productsList = products.map((p, idx) =>
    `--- PRODUCT ${idx + 1} (id: ${p.id}) ---
Title: ${p.title}
Description: ${(p.description || 'None').replace(/<[^>]*>/g, '').substring(0, 250)}
Price: ${p.price}
Variants: ${JSON.stringify(p.variants || 'None').substring(0, 100)}
Vendor: ${p.vendor || 'Unknown'}
Tags: ${p.tags || 'None'}`
  ).join('\n\n');

  const system = `You are a Shopify product data analyst. Analyze each product and return a JSON object.
Return ONLY this JSON structure with a "results" array of exactly ${products.length} items:
{
  "results": [
    {
      "id": "<product_id>",
      "summary": "<1-2 sentence analysis>",
      "missing_info": ["<missing field>"],
      "ambiguities": ["<unclear phrase>"],
      "confidence_score": <0-100>,
      "seo_score": <0-100>,
      "trust_signals": { "reviews_present": false, "policies_present": false }
    }
  ]
}`;

  try {
    const text = await requestAI(`Analyze these ${products.length} products:\n\n${productsList}`, system, true);
    const parsed = safeParseJSON(text);
    const arr = Array.isArray(parsed) ? parsed : (parsed.results || []);
    const map = {};
    arr.forEach((item, idx) => {
      const id = item.id || products[idx]?.id;
      if (id) map[String(id)] = item;
    });
    return map;
  } catch (err) {
    console.error('[AI] Batch perception failed:', err.message);
    // Return empty map — scoring service will use deterministic fallback
    return {};
  }
};

// ─── Auto Fix ─────────────────────────────────────────────────────────────────
export const runAutoFix = async (product, issues, retryCount = 0) => {
  const system = `You are an expert Shopify SEO copywriter and conversion specialist.
Rewrite the product listing to fix all detected issues and maximize sales.
Return ONLY valid JSON in this exact format:
{
  "fixed_title": "<improved SEO title, 60-80 chars>",
  "fixed_description": "<HTML: <b>bold intro</b>, <ul><li>features</li></ul>, Ideal For section>",
  "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "confidence": <85-99>
}`;

  const prompt = `Fix this Shopify product listing:

CURRENT TITLE: ${product.title}
CURRENT DESCRIPTION: ${(product.description || 'No description').replace(/<[^>]*>/g, '').substring(0, 400)}
DETECTED ISSUES: ${JSON.stringify(issues.map(i => i.type))}
PRICE: ${product.price || 'Not set'}

Write a complete, compelling rewrite that fixes all issues.`;

  try {
    const text = await requestAI(prompt, system, true);
    const result = safeParseJSON(text);
    // Validate required fields
    if (!result.fixed_title || !result.fixed_description) {
      throw new Error('AI fix response missing required fields');
    }
    return result;
  } catch (err) {
    if ((err.message?.includes('429') || err.message?.includes('quota')) && retryCount < 2) {
      const delay = (retryCount + 1) * 5000;
      console.warn(`[AutoFix] Rate limited. Retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      return runAutoFix(product, issues, retryCount + 1);
    }
    throw err;
  }
};
