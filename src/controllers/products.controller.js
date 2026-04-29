import { updateProduct } from '../services/shopify.service.js';
import History from '../models/History.js';
import { sessions } from '../config/session.js';

export const handleProductUpdate = async (req, res) => {
  const { 
    product_id, fixed_title, fixed_description, seo_keywords,
    original_title, original_description,
    before_score, after_score, ai_model_used
  } = req.body;

  if (!product_id) return res.status(400).json({ error: 'Missing product_id' });
  if (!fixed_title && !fixed_description && !seo_keywords?.length) {
    return res.status(400).json({ error: 'No data to update' });
  }

  try {
    console.log(`[Update] Pushing fix to Shopify for product ${product_id}...`);
    const updated = await updateProduct(product_id, fixed_title, fixed_description, seo_keywords);
    console.log(`[Update] ✅ "${updated.title}" updated on Shopify`);

    // Save to MongoDB History
    const improvement = (after_score && before_score) ? (after_score - before_score) : 0;
    
    await History.create({
      store_domain: sessions.storeDomain || 'unknown',
      product_id: product_id,
      product_title: updated.title,
      before_score: before_score || 0,
      after_score: after_score || 0,
      score_improvement: improvement,
      before_title: original_title || updated.title,
      after_title: fixed_title || updated.title,
      before_description: original_description || '',
      after_description: fixed_description || '',
      ai_model_used: ai_model_used || 'groq'
    });

    return res.json({ success: true, product_id: updated.id, title: updated.title });
  } catch (err) {
    // Clear permission error
    if (err.isPermissionError || err.message === 'WRITE_PERMISSION_MISSING') {
      console.error('[Update] ❌ No write_products scope on access token.');
      return res.status(403).json({
        success: false,
        error: 'WRITE_PERMISSION_MISSING',
        fix_steps: [
          'Go to: https://storeiq-dev-sy9ldjdy.myshopify.com/admin/settings/apps/development',
          'Click your private app → Edit → expand "Products" permissions',
          'Change from "Read" to "Read and write"',
          'Click Save → Copy the new Access Token',
          'Update SHOPIFY_ACCESS_TOKEN in your .env file',
          'Restart: node server.js',
        ]
      });
    }

    const status = err.response?.status || 500;
    console.error(`[Update] ❌ Failed (${status}):`, err.message);
    return res.status(status).json({ success: false, error: err.message });
  }
};
