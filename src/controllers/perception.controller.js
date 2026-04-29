import { analyzePerception } from '../services/perception.service.js';

export const handlePerceptionAnalysis = async (req, res) => {
  const { product } = req.body;
  if (!product) return res.status(400).json({ error: 'Missing product' });

  try {
    const analysis = await analyzePerception(product);
    if (!analysis) throw new Error('Perception analysis failed');
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
