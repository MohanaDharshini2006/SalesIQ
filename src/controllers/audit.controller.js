import { fetchProducts } from '../services/shopify.service.js';
import { runBatchPerceptionEngine, runAutoFix } from '../services/ai.service.js';
import { calculateProductMatrix } from '../services/scoring.service.js';

const BATCH_SIZE     = 5;    // 5 products per AI call
const BATCH_DELAY_MS = 1500; // 1.5s between batches — safe for both Groq & Gemini

// ─── In-Memory Cache ──────────────────────────────────────────────────────────
// Saves API quota: once audited, results are served from cache for 60 minutes.
let auditCache   = null;
let cacheBuiltAt = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const isCacheValid  = () => auditCache && cacheBuiltAt && (Date.now() - cacheBuiltAt < CACHE_TTL_MS);
const invalidateCache = () => { auditCache = null; cacheBuiltAt = null; };

// ─── POST /api/audit/store ────────────────────────────────────────────────────
export const runStoreAudit = async (req, res) => {
  const forceRefresh = req.query.refresh === 'true' || req.body?.force === true;

  // Serve from cache if valid and not force-refreshed
  if (isCacheValid() && !forceRefresh) {
    console.log(`[Audit] ✅ Serving cached results (${Math.round((Date.now() - cacheBuiltAt) / 60000)}m old)`);
    return res.json({ ...auditCache, cached: true });
  }

  try {
    console.log('\n[Audit] ══════════════════════════════════');
    console.log('[Audit]  Starting Full Store AI Audit');
    console.log('[Audit] ══════════════════════════════════');

    const allProducts = await fetchProducts();
    console.log(`[Audit] ${allProducts.length} products fetched from Shopify`);

    // Split into batches
    const batches = [];
    for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
      batches.push(allProducts.slice(i, i + BATCH_SIZE));
    }
    console.log(`[Audit] ${batches.length} batches → ${batches.length} AI calls\n`);

    // Process batches with delay to avoid rate limits
    const aiResultMap = {};
    for (let b = 0; b < batches.length; b++) {
      const batch  = batches[b];
      const titles = batch.map(p => `"${p.title.substring(0, 30)}"`).join(', ');
      console.log(`[Audit] Batch ${b + 1}/${batches.length}: ${titles}`);

      try {
        const batchResults = await runBatchPerceptionEngine(batch);
        Object.assign(aiResultMap, batchResults);
        console.log(`[Audit] Batch ${b + 1} ✅ (${Object.keys(batchResults).length} analyzed)`);
      } catch (batchErr) {
        console.warn(`[Audit] Batch ${b + 1} failed: ${batchErr.message} — using deterministic scores`);
      }

      if (b < batches.length - 1) {
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    // Score every product
    const results = allProducts.map(product => {
      const aiResult = aiResultMap[String(product.id)];
      const ai = aiResult || {
        summary: 'Scored using deterministic analysis.',
        missing_info: [],
        ambiguities: [],
        confidence_score: 0,
        seo_score: 50,
        trust_signals: { reviews_present: false, policies_present: false }
      };

      const matrix = calculateProductMatrix(product, ai);

      return {
        product_id:    product.id,
        title:         product.title,
        description:   product.description,
        image:         product.image,
        price:         product.price,
        scores:        matrix.scores,
        total_score:   matrix.scores.overall,
        gaps_detected: matrix.issues,
        ai_summary:    ai.summary,
        potential_gain: matrix.issues.reduce((sum, i) => sum + (i.impact_score || 0), 0),
        ai_powered:    !!aiResult
      };
    });

    // Sort: worst performers first
    results.sort((a, b) => a.total_score - b.total_score);

    const n          = results.length || 1;
    const avg        = (key) => Math.round(results.reduce((a, r) => a + (r.scores[key] || 0), 0) / n);
    const aiAnalyzed = results.filter(r => r.ai_powered).length;

    const payload = {
      store_overall_score: avg('overall'),
      averages: {
        completeness: avg('completeness'),
        clarity:      avg('clarity'),
        visibility:   avg('visibility'),
        trust:        avg('trust')
      },
      total_products:  allProducts.length,
      ai_analyzed:     aiAnalyzed,
      api_calls_used:  batches.length,
      cached:          false,
      results
    };

    // Store in cache
    auditCache   = payload;
    cacheBuiltAt = Date.now();

    console.log(`\n[Audit] ✅ Complete! Score: ${payload.store_overall_score}% | AI: ${aiAnalyzed}/${results.length} | Calls: ${batches.length}`);
    return res.json(payload);

  } catch (err) {
    console.error('[Audit] Fatal error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/audit/auto-fix ─────────────────────────────────────────────────
export const handleAutoFix = async (req, res) => {
  const { product_id, issues } = req.body;
  if (!product_id) return res.status(400).json({ error: 'Missing product_id' });

  try {
    // Try to find product from cache first (saves a Shopify API call)
    let product = auditCache?.results?.find(p => String(p.product_id) === String(product_id));

    if (!product) {
      const products = await fetchProducts();
      const raw = products.find(p => String(p.id) === String(product_id));
      if (!raw) return res.status(404).json({ error: 'Product not found in Shopify store' });
      product = raw;
    }

    console.log(`[AutoFix] Generating AI fix for "${product.title}"...`);
    const fix = await runAutoFix(product, issues || []);
    console.log(`[AutoFix] ✅ Fix ready — confidence: ${fix.confidence}%`);
    return res.json(fix);

  } catch (err) {
    console.error('[AutoFix] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/history ─────────────────────────────────────────────────────────
const changeHistory = [];
export const getChangeHistory = (req, res) => res.json(changeHistory);

export const recordChange = (data) => {
  changeHistory.unshift({
    id: Date.now(),
    ...data,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  });
  // Invalidate audit cache so re-audit shows updated scores
  invalidateCache();
};
