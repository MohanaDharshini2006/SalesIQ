import { requestAI } from './ai.service.js';

export const analyzePerception = async (product) => {
  const prompt = `Analyze this Shopify product:
TITLE: ${product.title || 'No Title'}
DESCRIPTION: ${product.description || 'No Description'}

Return ONLY a valid JSON object matching this exact shape:
{
  "merchant_intent": "1 sentence summarizing what the merchant is trying to sell",
  "ai_perception": "1 sentence summarizing what a customer actually understands from this listing",
  "perception_gap": {
    "missing_fields": ["array of missing critical info like size, material, etc"],
    "ambiguities": ["array of ambiguous phrases like 'high quality'"],
    "contradictions": ["array of contradictions, or empty if none"]
  },
  "issues": [
    {
      "type": "type of issue (e.g., missing_description, weak_title)",
      "description": "short description of the issue",
      "impact_score": <number 1-10>,
      "effort_score": <number 1-10>,
      "reasoning": "short reasoning"
    }
  ]
}`;

  try {
    const text = await requestAI(prompt, 'You are an expert e-commerce analyst. Reply only with valid JSON.', true);
    
    let parsed;
    try {
      let clean = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { 
        merchant_intent: 'Unknown intent', 
        ai_perception: 'Analysis failed', 
        perception_gap: { missing_fields: [], ambiguities: [], contradictions: [] }, 
        issues: [] 
      };
    }

    let conf = 100;
    if (!product.description || product.description === 'No description') conf -= 25;
    if (!product.image) conf -= 20;
    if (parsed.perception_gap?.ambiguities?.length > 0) conf -= 15;
    
    const issues = (parsed.issues || []).map(i => {
      const ratio = (i.impact_score || 5) / (i.effort_score || 5);
      let priority = 'LOW';
      if (ratio >= 1.5) priority = 'HIGH';
      else if (ratio >= 0.8) priority = 'MEDIUM';
      return { ...i, priority };
    });
    
    issues.sort((a,b) => {
      const pMap = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return pMap[b.priority] - pMap[a.priority];
    });

    return {
      product_id: product.id || product.product_id,
      merchant_intent: parsed.merchant_intent || 'Not clear',
      ai_perception: parsed.ai_perception || 'Not clear',
      perception_gap: {
        missing_fields: parsed.perception_gap?.missing_fields || [],
        ambiguities: parsed.perception_gap?.ambiguities || [],
        contradictions: parsed.perception_gap?.contradictions || []
      },
      issues,
      ai_recommendation_confidence: Math.max(0, conf)
    };
  } catch (err) {
    return null;
  }
};
