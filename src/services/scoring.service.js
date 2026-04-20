/**
 * Deterministic Scoring Engine
 * Computes 4-pillar scores from raw Shopify data + AI perception output
 */
export const calculateProductMatrix = (product, ai) => {
  let completeness = 100;
  let clarity = 100;
  let visibility = ai.seo_score ?? 70;
  let trust = 100;
  const issues = [];

  const addIssue = (type, severity, impact) => {
    issues.push({ type, severity, impact_score: impact });
    return impact;
  };

  // --- COMPLETENESS ---
  if (!product.description || product.description.trim() === '' || product.description === 'No description') {
    completeness -= addIssue('missing_description', 'high', 30);
  }
  if (!product.image) {
    completeness -= addIssue('missing_image', 'critical', 35);
  }
  if (!product.variants || product.variants === '' || product.variants === 'Default Title') {
    completeness -= addIssue('no_variants', 'medium', 10);
  }
  if (ai.missing_info?.length > 0 && ai.missing_info[0] !== 'analysis_failed') {
    const impact = Math.min(ai.missing_info.length * 10, 30);
    completeness -= addIssue('ai_missing_attributes', 'medium', impact);
  }

  // --- CLARITY ---
  const words = product.description ? product.description.split(/\s+/).length : 0;
  if (words > 0 && words < 15) {
    clarity -= addIssue('description_too_short', 'medium', 20);
  }
  if (ai.ambiguities?.length > 0) {
    const impact = Math.min(ai.ambiguities.length * 15, 40);
    clarity -= addIssue('text_ambiguity', 'high', impact);
  }

  // --- VISIBILITY ---
  const titleWords = product.title ? product.title.split(/\s+/).length : 0;
  if (titleWords < 3) {
    visibility -= addIssue('title_too_short_for_seo', 'high', 20);
  } else if (titleWords > 12) {
    visibility -= addIssue('title_keyword_stuffed', 'medium', 15);
  }

  // --- TRUST ---
  if (!ai.trust_signals?.reviews_present) {
    trust -= addIssue('no_reviews', 'high', 25);
  }
  if (!ai.trust_signals?.policies_present) {
    trust -= addIssue('missing_policies', 'critical', 30);
  }

  const clamp = v => Math.max(0, Math.min(100, Math.round(v)));
  completeness = clamp(completeness);
  clarity = clamp(clarity);
  visibility = clamp(visibility);
  trust = clamp(trust);
  const overall = clamp((completeness + clarity + visibility + trust) / 4);

  issues.sort((a, b) => b.impact_score - a.impact_score);

  return {
    scores: { completeness, clarity, visibility, trust, overall },
    issues
  };
};
