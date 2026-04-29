import { requestAI } from '../services/ai.service.js';

export const handleChat = async (req, res) => {
  const { message, title, price, products, history } = req.body;

  if (!message) return res.status(400).json({ error: 'Message is required' });

  const systemPrompt = `You are a specialized Shopify Store Consultant.
Your goal is to help merchants improve their store performance based on AI audit data.
CONTEXT:
- Store Domain: ${title}
- Active Product (if any): ${title} (Price: ${price})
- Store Summary: ${products?.length || 0} products analyzed.

GUIDELINES:
1. Be professional, concise, and actionable.
2. If the merchant asks about a specific product, use the provided product context.
3. If the merchant asks for general advice, suggest focusing on Trust Signals (reviews/policies) or SEO.
4. Do not speculate on Shopify technical issues outside of content optimization.
5. Keep your tone encouraging.`;

  const chatHistory = (history || []).map(m => 
    `${m.role === 'user' ? 'Merchant' : 'AI Consultant'}: ${m.text}`
  ).join('\n');

  const fullPrompt = `${chatHistory}\nMerchant: ${message}\nAI Consultant:`;

  try {
    const response = await requestAI(fullPrompt, systemPrompt);
    res.json({ text: response });
  } catch (err) {
    console.error('[Chat Controller] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
