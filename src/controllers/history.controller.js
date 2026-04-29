import History from '../models/History.js';
import { sessions } from '../config/session.js';

export const getHistory = async (req, res) => {
  try {
    const store = req.query.store || sessions.storeDomain;
    const limit = parseInt(req.query.limit) || 50;
    
    if (!store) return res.status(400).json({ error: 'Store domain required' });

    const history = await History.find({ store_domain: store })
      .sort({ timestamp: -1 })
      .limit(limit);
      
    res.json(history);
  } catch (err) {
    console.error(`[History API] Error:`, err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getHistoryStats = async (req, res) => {
  try {
    const store = req.query.store || sessions.storeDomain;
    if (!store) return res.status(400).json({ error: 'Store domain required' });

    const history = await History.find({ store_domain: store });
    
    const total_products_fixed = history.length;
    let total_improvement = 0;
    let best_improvement = 0;
    let recent_activity_count = 0;
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    history.forEach(h => {
      const improvement = h.score_improvement || 0;
      total_improvement += improvement;
      if (improvement > best_improvement) {
        best_improvement = improvement;
      }
      if (h.timestamp >= oneDayAgo) {
        recent_activity_count++;
      }
    });

    const avg_score_improvement = total_products_fixed > 0 
      ? Math.round(total_improvement / total_products_fixed) 
      : 0;

    res.json({
      total_products_fixed,
      avg_score_improvement,
      best_improvement,
      recent_activity_count
    });
  } catch (err) {
    console.error(`[History Stats API] Error:`, err.message);
    res.status(500).json({ error: err.message });
  }
};
