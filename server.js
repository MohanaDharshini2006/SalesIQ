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
 * AI Chat Assistant Endpoint
 */
app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  try {
    const { requestAI } = await import('./src/services/ai.service.js');
    const system = `You are the StoreIQ AI Concierge, a brilliant e-commerce auditor.
    CONTEXT:
    Overall Store Score: ${context?.score}%
    Total Products: ${context?.count}
    Major Issues: ${context?.issues?.join(', ')}
    
    Instruction: Answer the merchant's questions clearly. Be strategic, encouraging, and highly technical about AI Shopping Agents.`;
    
    const response = await requestAI(message, system);
    res.json({ response });
  } catch (err) {
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
