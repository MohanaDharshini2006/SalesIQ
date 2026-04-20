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
    const system = `You are the StoreIQ Audit Consultant. 

    FORMATTING COMMANDS:
    1. NEVER use asterisks (*) or stars ever.
    2. NEVER use markdown like # or **.
    3. Use ONLY PLAIN TEXT and NUMBERED LISTS (1., 2., 3.).
    4. For headers, use ALL CAPS labels.

    RESPONSE STRUCTURE:
    ANALYSIS REPORT FOR [PRODUCT]:
    1. OVERALL SCORE: X
    2. PILLAR BREAKDOWN:
       - COMPLETENESS: score
       - CLARITY: score
       - VISIBILITY: score
       - TRUST: score
    3. VERIFIED GAPS: (List only exact gap types from data)

    PRIORITY ACTION STEPS:
    1. HIGH PRIORITY: (Specific fix)
    2. PROJECTED LIFT: +X points

    DATA SOURCE (SCANNED):
    ${JSON.stringify(context?.full_results)}`;
    
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
