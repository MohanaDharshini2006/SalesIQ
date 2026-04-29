import express from 'express';
import { runStoreAudit, handleAutoFix } from '../controllers/audit.controller.js';
import { handleProductUpdate } from '../controllers/products.controller.js';
import { handleChat } from '../controllers/chat.controller.js';
import { handlePerceptionAnalysis } from '../controllers/perception.controller.js';
import { getHistory, getHistoryStats } from '../controllers/history.controller.js';

const router = express.Router();

router.post('/audit/store', runStoreAudit);
router.post('/audit/auto-fix', handleAutoFix);
router.post('/update-product', handleProductUpdate);
router.post('/perception-analysis', handlePerceptionAnalysis);

router.get('/history', getHistory);
router.get('/history/stats', getHistoryStats);

export default router;
