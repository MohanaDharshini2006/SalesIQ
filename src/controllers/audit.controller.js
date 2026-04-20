import { fetchProducts } from '../services/shopify.service.js';
import { runBatchPerceptionEngine, runAutoFix } from '../services/ai.service.js';
import { calculateProductMatrix } from '../services/scoring.service.js';

const BATCH_SIZE = 5; // Analyze 5 products per Gemini API call
const BATCH_DELAY_MS = 6000; // 6 seconds between batches — well within 15 RPM

/**
 * POST /api/audit/store
 * Analyzes ALL Shopify products using BATCHED Gemini calls.
 * 25 products = 5 batches = only 5 API calls (instead of 25).
 */
export const runStoreAudit = async (req, res) => {
  try {
    console.log(`\n[Audit] ======================================`);
    console.log(`[Audit] Starting Full Store Audit (Batched)`);
    console.log(`[Audit] ======================================`);

    const allProducts = await fetchProducts();
    console.log(`[Audit] ${allProducts.length} products found. Using batch size of ${BATCH_SIZE}.`);

    // Split into batches
    const batches = [];
    for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
      batches.push(allProducts.slice(i, i + BATCH_SIZE));
    }
    console.log(`[Audit] ${batches.length} batches to process → ${batches.length} API calls total.\n`);

    // Process each batch
    const aiResultMap = {}; // product_id → AI analysis
    for (let b = 0; b < batches.length; b++) {
      const batch = batches[b];
      const titles = batch.map(p => `"${p.title}"`).join(', ');
      console.log(`[Audit] Batch ${b + 1}/${batches.length}: ${titles}`);

      const batchResults = await runBatchPerceptionEngine(batch);
      Object.assign(aiResultMap, batchResults);

      // Wait between batches to avoid rate limits
      if (b < batches.length - 1) {
        console.log(`[Audit] Batch ${b + 1} complete. Waiting ${BATCH_DELAY_MS / 1000}s before next batch...`);
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    // Build scored results for every product
    const results = allProducts.map(product => {
      const aiResult = aiResultMap[String(product.id)];
      
      if (aiResult) {
        console.log(`[✓] ${product.title} — AI score: ${aiResult.seo_score}`);
      } else {
        console.log(`[~] ${product.title} — using deterministic scoring only`);
      }

      // Use AI result if available, otherwise use a neutral fallback
      const ai = aiResult || {
        summary: 'Deterministic analysis only — AI analysis pending.',
        missing_info: [],
        ambiguities: [],
        confidence_score: 0,
        seo_score: 50,
        trust_signals: { reviews_present: false, policies_present: false }
      };

      const matrix = calculateProductMatrix(product, ai);

      return {
        product_id: product.id,
        title: product.title,
        description: product.description,
        image: product.image,
        price: product.price,
        scores: matrix.scores,
        total_score: matrix.scores.overall,
        gaps_detected: matrix.issues,
        ai_summary: ai.summary,
        potential_gain: matrix.issues.reduce((sum, i) => sum + (i.impact_score || 0), 0),
        ai_powered: !!aiResult
      };
    });

    // Sort: lowest score first (needs most attention)
    results.sort((a, b) => a.total_score - b.total_score);

    const n = results.length || 1;
    const avg = (key) => Math.round(results.reduce((a, r) => a + r.scores[key], 0) / n);
    const aiAnalyzed = results.filter(r => r.ai_powered).length;

    console.log(`\n[Audit] ✅ Complete!`);
    console.log(`[Audit] Products: ${results.length} | AI-analyzed: ${aiAnalyzed} | API calls used: ${batches.length}`);
    console.log(`[Audit] Store Score: ${avg('overall')}%\n`);

    return res.json({
      store_overall_score: avg('overall'),
      averages: {
        completeness: avg('completeness'),
        clarity: avg('clarity'),
        visibility: avg('visibility'),
        trust: avg('trust')
      },
      total_products: allProducts.length,
      ai_analyzed: aiAnalyzed,
      api_calls_used: batches.length,
      results
    });

  } catch (err) {
    console.error('[Audit] Fatal:', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/audit/auto-fix
 */
export const handleAutoFix = async (req, res) => {
  const { product_id, issues } = req.body;
  if (!product_id) return res.status(400).json({ error: 'Missing product_id' });

  try {
    const products = await fetchProducts();
    const product = products.find(p => String(p.id) === String(product_id));
    if (!product) return res.status(404).json({ error: 'Product not found' });

    console.log(`[AutoFix] Generating AI fix for "${product.title}"...`);
    const fix = await runAutoFix(product, issues);
    return res.json(fix);
  } catch (err) {
    console.error('[AutoFix]', err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/history
 */
const changeHistory = [];
export const getChangeHistory = (req, res) => res.json(changeHistory);

export const recordChange = (data) => {
  const { productId, title, titleAfter, descBefore, descAfter, keywords, scoreBefore, scoreAfter } = data;
  changeHistory.unshift({
    id: Date.now(),
    product_id: productId,
    title,
    title_after: titleAfter,
    desc_before: descBefore,
    desc_after: descAfter,
    keywords,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    changes: 'Amazon-Style Content Optimization',
    improvement: scoreAfter - scoreBefore,
    score_before: scoreBefore,
    score_after: scoreAfter
  });
};
