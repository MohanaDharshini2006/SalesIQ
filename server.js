import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import apiRoutes from './src/routes/index.js';
import { sessions } from './src/config/session.js';

const app  = express();
const PORT = process.env.PORT || 3001;

console.log('--- StoreIQ Environment Check ---');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Present (starts with ' + process.env.GROQ_API_KEY.substring(0, 7) + ')' : 'MISSING');
console.log('GEMINI_API_KEY:', process.env.VITE_GEMINI_API_KEY ? 'Present (starts with ' + process.env.VITE_GEMINI_API_KEY.substring(0, 7) + ')' : 'MISSING');
console.log('SHOPIFY_STORE:', process.env.SHOPIFY_STORE_DOMAIN || 'MISSING');
console.log('---------------------------------');

app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  if (req.path !== '/health') {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  }
  next();
});

// ─── POST /api/connect-store ────────────────────────────────────────────────
app.post('/api/connect-store', (req, res) => {
  const { storeDomain } = req.body;
  if (!storeDomain || typeof storeDomain !== 'string' || !storeDomain.includes('.myshopify.com')) {
    return res.status(400).json({ error: 'Valid store domain ending in .myshopify.com is required' });
  }
  sessions.connected = true;
  sessions.storeDomain = storeDomain;
  res.json({ success: true, store: storeDomain });
});

// ─── GET /api/connection-status ──────────────────────────────────────────────
app.get('/api/connection-status', (req, res) => {
  res.json({
    connected: sessions.connected,
    store: sessions.storeDomain
  });
});

app.post('/api/disconnect-store', (req, res) => {
  sessions.connected = false;
  sessions.storeDomain = null;
  sessions.accessToken = null;
  res.json({ success: true });
});

function requireConnection(req, res, next) {
  if (req.path === '/disconnect-store') return next();
  if (!sessions.connected) {
    return res.status(401).json({ error: "Store not connected" });
  }
  next();
}

app.use('/api', requireConnection);

// API routes
app.use('/api', apiRoutes);

// ─── POST /api/chat ─────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, title, price, products, history } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

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
    console.error('[Chat]', err.message);
    res.status(500).json({
      error: err.message,
      text: 'Sorry, the AI is temporarily unavailable. Both Groq and Gemini APIs may be rate-limited. Please try again in a moment.'
    });
  }
});

// ─── POST /api/update-product ────────────────────────────────────────────────
app.post('/api/update-product', async (req, res) => {
  const { product_id, fixed_title, fixed_description, seo_keywords } = req.body;
  if (!product_id) return res.status(400).json({ error: 'Missing product_id' });

  try {
    const { updateProduct } = await import('./src/services/shopify.service.js');
    const updated = await updateProduct(product_id, fixed_title, fixed_description, seo_keywords);
    res.json({ success: true, product: updated });
  } catch (err) {
    console.error('[Update]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/perception-analysis ──────────────────────────────────────────
app.post('/api/perception-analysis', async (req, res) => {
  const { products } = req.body;
  if (!products || !Array.isArray(products)) return res.status(400).json({ error: 'Missing products array' });

  try {
    const { analyzePerception } = await import('./src/services/perception.service.js');
    const results = [];
    for (const p of products) {
      const parsed = await analyzePerception(p);
      if (parsed) results.push(parsed);
    }
    res.json({ products: results });
  } catch (err) {
    console.error('[Perception]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /health ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:   'OK',
    service:  'StoreIQ API',
    version:  '2.0',
    ai: {
      groq:   process.env.GROQ_API_KEY   ? '✓ Configured' : '✗ Missing',
      gemini: process.env.VITE_GEMINI_API_KEY ? '✓ Configured (fallback)' : '✗ Missing'
    },
    shopify:  process.env.SHOPIFY_STORE_DOMAIN || '✗ Missing',
    uptime:   `${Math.round(process.uptime())}s`
  });
});

// ─── 404 catch-all ────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const groq   = process.env.GROQ_API_KEY           ? '✅ Groq'          : '❌ Groq MISSING';
  const gemini = process.env.VITE_GEMINI_API_KEY     ? '✅ Gemini'        : '⚠️  Gemini missing (optional fallback)';
  const shop   = process.env.SHOPIFY_STORE_DOMAIN    ? `✅ ${process.env.SHOPIFY_STORE_DOMAIN}` : '❌ Shopify MISSING';

  console.log(`\n  ╔═══════════════════════════════════════════╗`);
  console.log(`  ║   StoreIQ API  →  http://localhost:${PORT}   ║`);
  console.log(`  ╚═══════════════════════════════════════════╝`);
  console.log(`  AI Primary:  ${groq}`);
  console.log(`  AI Fallback: ${gemini}`);
  console.log(`  Shopify:     ${shop}`);
  console.log(`  Strategy:    Groq → Gemini Flash → Error\n`);
});
