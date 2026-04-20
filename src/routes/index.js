import express from 'express';
import { runStoreAudit, handleAutoFix, getChangeHistory } from '../controllers/audit.controller.js';
import { handleProductUpdate } from '../controllers/products.controller.js';

const router = express.Router();

router.post('/audit/store', runStoreAudit);
router.post('/audit/auto-fix', handleAutoFix);
router.post('/update-product', handleProductUpdate);
router.get('/history', getChangeHistory);

export default router;
