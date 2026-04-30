import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './src/routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { sessions } from './src/config/session.js';
import { connectDB } from './src/config/db.js';

connectDB();

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
  const { message, title, price, products, productNames, history } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const { requestAI } = await import('./src/services/ai.service.js');

    // Build full store context
    const storeContext = (products || []).slice(0, 25).map(p => ({
      title:       p.title,
      price:       p.price,
      total_score: p.total_score,
      scores:      p.scores,
      gaps:        (p.gaps_detected || []).map(g => g.type),
      snippet:     (p.description || '').replace(/<[^>]*>/g, '').substring(0, 150)
    }));

    const currentProduct = (products || []).find(p => p.title === title)
      || (products?.[0]) || { title, price };

    const historyContext = (history || [])
      .slice(-8)
      .map(m => `${m.type === 'user' ? 'User' : 'AI'}: ${m.text}`)
      .join('\n');

    const hasStoreData = storeContext.length > 0;
    const allProductTitles = (productNames || storeContext.map(p => p.title)).join('\n- ');

    const system = `You are StoreIQ, a friendly and smart AI assistant for an e-commerce store.

YOUR PERSONALITY:
- Warm, conversational, and easy to understand.
- For greetings (Hi, Hey, Hello) — just greet back simply and ask what they need.
- For store/product questions — be specific, clear, and helpful using the actual store data.
- Keep responses short and easy to read. Plain English only. No jargon.
- Never use markdown headers or ** bold ** formatting.

${hasStoreData ? `FULL STORE PRODUCT LIST (use this to identify what the user is asking about):
- ${allProductTitles}

FULL PRODUCT DATA (scores, gaps, descriptions):
${JSON.stringify(storeContext, null, 2)}

PRODUCT IDENTIFICATION RULES:
- The user may refer to products using short names, categories, or keywords (e.g. "serum", "skincare", "running shoe", "snowboard").
- You MUST scan the full product list above and match what the user means by keywords — even if they don't use the exact product name.
- Example: if user says "skincare serum" and there is a product called "Hydrating Serum for Radiant Skin", match it and respond about that product.
- Always state the full product name you matched so the user knows you found it.
- If no product matches at all, say so clearly.

WHEN ASKED ABOUT A PRODUCT — ALWAYS INCLUDE:
1. Confirm which product you found (state its full name).
2. Its current score out of 100 (from total_score).
3. What issues the system found (from gaps array) — explain each in one plain sentence.
4. 3-5 recommended SEO keywords for that product based on its name and category.
5. The single most important thing to fix first.

SEO KEYWORD FORMAT: Say "Good keywords to target: keyword1, keyword2, keyword3"
Base keywords on what customers would actually search for this type of product.`
: 'No store data loaded yet. Tell the user to click "Run AI Audit" first to scan their store.'}

CONVERSATION SO FAR:
${historyContext || 'Start of conversation.'}

RESPONSE RULES:
1. Greetings → short friendly reply only. Do NOT give product advice.
2. Product questions → identify the product by keyword, give score, gaps explained simply, keyword suggestions, and top fix.
3. General questions → answer simply and naturally.
4. Keep it brief. One short paragraph or a compact list is enough.`;

    const response = await requestAI(message.trim(), system, false);
    const clean = response
      .replace(/\*\*/g, '')
      .replace(/^#+\s/gm, '')
      .replace(/^\*\s/gm, '• ')
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

// ─── 404 catch-all FOR API ───────────────────────────────────────────────────
app.use('/api', (req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));

// ─── Frontend Serving ────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

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
