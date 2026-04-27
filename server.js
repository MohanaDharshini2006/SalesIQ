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
  const { storeDomain, accessToken } = req.body;
  if (!storeDomain || typeof storeDomain !== 'string' || !storeDomain.includes('.myshopify.com')) {
    return res.status(400).json({ error: 'Valid store domain ending in .myshopify.com is required' });
  }
  if (!accessToken || !accessToken.startsWith('shpat_')) {
    return res.status(400).json({ error: 'Valid Shopify Admin API Token starting with shpat_ is required' });
  }
  sessions.connected = true;
  sessions.storeDomain = storeDomain;
  sessions.accessToken = accessToken;
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

    // Build compact store context (avoid token overflows)
    const storeContext = (products || []).slice(0, 20).map(p => ({
      title:       p.title,
      price:       p.price,
      total_score: p.total_score,
      scores:      p.scores,
      gaps:        (p.gaps_detected || []).map(g => g.type),
      snippet:     (p.description || '').replace(/<[^>]*>/g, '').substring(0, 100)
    }));

    const currentProduct = (products || []).find(p => p.title === title)
      || (products?.[0]) || { title, price };

    const historyContext = (history || [])
      .slice(-8)
      .map(m => `${m.type === 'user' ? 'User' : 'AI'}: ${m.text}`)
      .join('\n');

    const system = `You are an AI ecommerce consultant.
You analyze store data and provide actionable business advice to improve AI visibility, conversions, and trust.

CURRENTLY FOCUSED PRODUCT:
${JSON.stringify(currentProduct, null, 2)}

ALL PRODUCTS & SCORES:
${JSON.stringify(storeContext, null, 2)}

CONVERSATION HISTORY:
${historyContext || 'First message'}

YOUR RULES:
- Clear advice
- Prioritized recommendations
- No generic chatbot replies`;

    const response = await requestAI(message.trim(), system, false);
    const clean = response
      .replace(/\*\*/g, '')
      .replace(/^#+\s/gm, '')
      .trim();

    res.json({ text: clean });

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
