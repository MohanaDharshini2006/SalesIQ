import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './src/routes/index.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  if (req.path !== '/health') {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  }
  next();
});

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

    const system = `You are StoreIQ — an expert AI assistant for Shopify store optimization.
You are talking to the store owner and helping them improve product scores and sales.

CURRENTLY FOCUSED PRODUCT:
${JSON.stringify(currentProduct, null, 2)}

ALL PRODUCTS & SCORES:
${JSON.stringify(storeContext, null, 2)}

CONVERSATION HISTORY:
${historyContext || 'First message'}

YOUR RULES:
- Be conversational, friendly, and specific. Use the actual data above.
- If they ask about a product, reference its real score, gaps, and suggest specific fixes.
- If they ask to fix/improve something, give a concrete rewrite or step-by-step plan.
- Use bullet points (- item) for clarity. No asterisks (**). No markdown headers.
- Keep answers focused and under 200 words unless a detailed breakdown is asked.
- Always tie advice back to real product metrics from the data above.`;

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
