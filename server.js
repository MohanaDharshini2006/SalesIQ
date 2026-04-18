import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Initialize Gemini with v1 API
const apiKey = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
// Note: SDK defaults can vary, but we ensure we are using a stable model.
// Forcing the model to a version that exists in v1.

const SYSTEM_INSTRUCTION = `You are an INTELLIGENT PRODUCT ASSISTANT.

STRICT RULES:
1. Always identify the product mentioned in the user's query.
2. Only answer using data from that specific product.
3. If an attribute (like color, size, material, etc.) is missing in the provided data, use the product name, description, and image to INFER a realistic attribute.
4. NEVER say "Attribute not found for this product" or "I don't know". Always provide a helpful, inferred answer.
5. Your response MUST be exactly ONE SENTENCE.
6. If multiple products are loaded, isolate context correctly.
7. Do NOT include system logs like SYNC_COMPLETE or SYSTEM_STATUS.

CONTEXT HANDLING:
- Each product has its own independent attributes.
- Use the provided description and image content to understand the product better.
- If the target entity (product name) is unclear, ask for clarification.`;

const model = genAI.getGenerativeModel({ 
  model: 'gemini-3-flash-preview',
}, { apiVersion: 'v1beta' });

// Helper to convert Image URL to Generative Part
async function urlToGenerativePart(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const mimeType = response.headers['content-type'];
    return {
      inlineData: {
        data: Buffer.from(response.data).toString('base64'),
        mimeType
      }
    };
  } catch (error) {
    console.error(`[Image Parsing Error] Failed to fetch image from ${url}:`, error.message);
    return null; // Fallback to text-only if image fails
  }
}

app.post('/api/analyze', async (req, res) => {
  const { title, description, image } = req.body;

  console.log(`[BACKEND][REQUEST] POST /api/analyze | Body:`, JSON.stringify(req.body, null, 2));

  try {
    if (!apiKey) {
      console.error('[BACKEND][ERROR] VITE_GEMINI_API_KEY is missing');
      return res.status(500).json({ error: 'INVALID_API_KEY: Gemini API Key is not configured on the server.' });
    }

    const imagePart = image ? await urlToGenerativePart(image) : null;
    
    const initialPrompt = `${SYSTEM_INSTRUCTION}\n\nAnalyze this product:\nName: ${title}\nDescription: ${description || 'No description'}\n\nProvide a one-sentence summary of this product.`;

    const parts = imagePart ? [initialPrompt, imagePart] : [initialPrompt];

    console.log(`[BACKEND][AI] Calling Gemini v1 API (Analyze) for model: ${model.model}`);
    console.log(`[BACKEND][AI] Prompt check: "${initialPrompt.substring(0, 50)}..."`);
    
    const result = await model.generateContent(parts);
    const response = await result.response;
    const responseText = response.text().trim();
    
    console.log(`[BACKEND][RESPONSE] /api/analyze | Status: OK | Text length: ${responseText.length}`);
    res.json({ text: responseText });
  } catch (error) {
    console.error('[BACKEND][ERROR] /api/analyze failed:', error.message);
    res.status(500).json({ 
      error: `SERVER_ERROR: ${error.message}`,
      details: error.stack 
    });
  }
});

app.post('/api/chat', async (req, res) => {
  const { title, price, message, history, products, image } = req.body;
  
  console.log(`[BACKEND][REQUEST] POST /api/chat | Message: "${message}" | Current Product: ${title}`);

  try {
    if (!apiKey) {
      return res.status(500).json({ error: 'INVALID_API_KEY' });
    }

    // Extract product image if not provided directly
    const currentProduct = products?.find(p => p.title === title);
    const effectiveImage = image || currentProduct?.image;
    const imagePart = effectiveImage ? await urlToGenerativePart(effectiveImage) : null;

    // Prepare context with all available products for precise selection
    let contextStr = "AVAILABLE PRODUCTS DATA:\n";
    if (products && Array.isArray(products)) {
      products.forEach(p => {
        contextStr += `- ${p.title}: Price: ${p.price || 'Unknown'}, Description: ${p.description || 'No description'}\n`;
      });
    } else if (title && title !== 'General Browsing') {
      const priceInfo = price ? `$${price}` : 'Unknown';
      contextStr += `- ${title}: Price: ${priceInfo}\n`;
    }

    const fullPrompt = `${SYSTEM_INSTRUCTION}\n\n${contextStr}\n\nCURRENT CONTEXT: Chatting about ${title}\n\nUser Question: ${message}\n\nInference Task: If user asks for an attribute not in the text context, use the image and product name to infer a realistic answer. Keep it to one sentence.`;

    // Filter and format history
    const formattedHistory = (history || [])
      .filter(h => h.text && h.text.trim() !== "" && !h.text.includes("SYSTEM_STATUS") && !h.text.includes("Connection Error"))
      .map(h => ({
        role: h.type === 'ai' || h.type === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }]
      }));

    // Find the first user message to start the history
    const firstUserIdx = formattedHistory.findIndex(h => h.role === 'user');
    let finalHistory = [];
    if (firstUserIdx !== -1) {
      const historyFromFirstUser = formattedHistory.slice(firstUserIdx);
      
      // Ensure history ends with a 'model' message so it can be followed by a 'user' message in sendMessage
      // We take pairs: [user, model, user, model...]
      for (let i = 0; i < historyFromFirstUser.length - 1; i += 2) {
        if (historyFromFirstUser[i].role === 'user' && historyFromFirstUser[i+1].role === 'model') {
          finalHistory.push(historyFromFirstUser[i]);
          finalHistory.push(historyFromFirstUser[i+1]);
        } else {
          // If the pattern breaks, we stop here to avoid API errors
          break;
        }
      }
    }

    let responseText = "";

    const debugUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`;
    console.log(`[BACKEND][AI] Request URL (Target): ${debugUrl}`);

    if (finalHistory.length === 0) {
      // Single turn - use generateContent
      console.log('[BACKEND][AI] Using generateContent (no valid history pairs)');
      
      const parts = imagePart ? [fullPrompt, imagePart] : [fullPrompt];
      const result = await model.generateContent(parts);
      const response = await result.response;
      responseText = response.text().trim();
    } else {
      // Multi turn
      console.log(`[BACKEND][AI] Using startChat with ${finalHistory.length} history items (starting with user, alternating)`);
      
      const chat = model.startChat({ 
        history: finalHistory,
      });
      
      const parts = imagePart ? [fullPrompt, imagePart] : [fullPrompt];
      const result = await chat.sendMessage(parts);
      const response = await result.response;
      responseText = response.text().trim();
    }
    
    console.log(`[BACKEND][RESPONSE] Success. Text length: ${responseText.length}`);
    res.json({ text: responseText });

  } catch (error) {
    console.error('[BACKEND][ERROR] /api/chat FAILED:', error.message);
    res.status(500).json({ 
      error: `[GoogleGenerativeAI Error]: ${error.message}`
    });
  }
});

app.listen(port, () => {
  console.log(`Backend service running at http://localhost:${port}`);
});
