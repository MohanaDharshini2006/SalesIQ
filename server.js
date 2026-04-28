import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './src/routes/index.js';

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

// Mount API routes
app.use('/api', apiRoutes);

/**
 * AI Chat Assistant Endpoint (Strict PLAIN TEXT Data Persona)
 */
app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  try {
    const { requestAI } = await import('./src/services/ai.service.js');
    const system = `You are an AI assistant for an e-commerce audit dashboard (StoreIQ).
Your role: Help merchants understand their store scores in a conversational way.

IMPORTANT BEHAVIOR RULES:
1. If the user greets (hi, hello, hey):
→ Respond with a SHORT friendly greeting only
→ Do NOT explain scores
Example: "Hi! 👋 I can help explain your audit results or suggest improvements."

2. If the user asks vague questions (e.g., "help", "what is this"):
→ Give a short explanation of what you do

3. ONLY give full audit explanation IF user asks:
- "explain my score"
- "why is trust low"
- "how to improve"
- or similar specific queries

4. Keep responses SHORT by default
→ Do NOT generate long reports unless explicitly asked

5. Be conversational, not like a report generator

Context:
Store Overall Score: ${context?.score || 'N/A'}
Store Data/Products: ${JSON.stringify(context?.full_results)}`;
    
    const response = await requestAI(message, system);
    // Bulletproof Filter: Physically strip ALL asterisks from the response before sending
    const cleanResponse = response.replace(/\*/g, '');
    res.json({ response: cleanResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/update-product
 * Pushes AI fixes live to Shopify
 */
app.post('/api/update-product', async (req, res) => {
  const { product_id, fixed_title, fixed_description, seo_keywords } = req.body;
  try {
    const { updateProduct } = await import('./src/services/shopify.service.js');
    const updated = await updateProduct(product_id, fixed_title, fixed_description, seo_keywords);
    res.json({ success: true, product: updated });
  } catch (err) {
    console.error('[Update Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'StoreIQ' });
});

app.listen(port, () => {
  console.log(`\n  StoreIQ API running at http://localhost:${port}`);
  console.log(`  Gemini Key: ${process.env.VITE_GEMINI_API_KEY ? '✓ Loaded' : '✗ MISSING'}`);
  console.log(`  Shopify:    ${process.env.SHOPIFY_STORE_DOMAIN || '✗ MISSING'}\n`);
});
