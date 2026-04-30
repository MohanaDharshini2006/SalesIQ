import { useState, useEffect } from 'react';

export const PerceptionModal = ({ product, onClose, onFixTrigger }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const r = await fetch('/api/perception-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product })
        });
        const d = await r.json();
        setAnalysis(d);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    fetchAnalysis();
  }, [product]);

  const getConfidenceColor = (score) => {
    if (score < 40) return '#EF4444'; 
    if (score < 70) return '#F59E0B'; 
    return '#10B981'; 
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container perception-modal">
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-eyebrow">Intent vs Reality</div>
            <h2 className="modal-title">AI Perception Engine</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16}}>
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="modal-body" style={{ flexDirection: 'column', overflowY: 'auto', padding: '24px 32px' }}>
          {loading ? (
            <div className="modal-loading" style={{ height: '300px' }}>
              <div className="modal-spinner" />
              <p className="modal-loading-text">Mapping merchant intent vs buyer perception...</p>
              <p className="modal-loading-sub">AI is analyzing product gaps.</p>
            </div>
          ) : analysis ? (
            <div className="perception-flow">
              
              <div className="perception-row">
                <div className="perception-card intent-card">
                  <h5>Merchant Intent</h5>
                  <p>{analysis.merchant_intent}</p>
                </div>
                <div className="perception-card reality-card">
                  <h5>Expected Buyer Perception</h5>
                  <p>{analysis.ai_perception}</p>
                </div>
              </div>

              <div className="perception-section">
                <h5>The Perception Gap</h5>
                <div className="perception-gap-list">
                  {analysis.perception_gap?.missing_fields?.map((f, i) => (
                    <span key={i} className="perception-tag missing">❌ Missing: {f}</span>
                  ))}
                  {analysis.perception_gap?.ambiguities?.map((a, i) => (
                    <span key={i} className="perception-tag ambiguous">⚠ Ambiguous: {a}</span>
                  ))}
                  {analysis.perception_gap?.contradictions?.map((c, i) => (
                    <span key={i} className="perception-tag contradiction">❗ Contradicting: {c}</span>
                  ))}
                  {!analysis.perception_gap?.missing_fields?.length && !analysis.perception_gap?.ambiguities?.length && !analysis.perception_gap?.contradictions?.length && (
                     <span className="perception-tag none">✓ No critical gaps detected.</span>
                  )}
                </div>
              </div>

              {analysis.issues?.length > 0 && (
                <div className="perception-section">
                  <h5>Priority Engineering (Impact vs Effort)</h5>
                  <div className="perception-priorities">
                    {analysis.issues.slice(0, 3).map((issue, i) => (
                      <div key={i} className="priority-banner">
                        <div className="priority-icon">
                          {issue.priority === 'HIGH' ? '🔴' : issue.priority === 'MEDIUM' ? '🟡' : '🟢'}
                        </div>
                        <div className="priority-details">
                          <div className="priority-title">{issue.priority}: {issue.description.replace(/_/g, ' ')}</div>
                          <div className="priority-meta">
                            <span>Impact: <strong style={{color:'#fff'}}>{issue.impact_score}/10</strong></span>
                            <span style={{margin:'0 8px', opacity:0.3}}>|</span>
                            <span>Effort: <strong style={{color:'#fff'}}>{issue.effort_score}/10</strong></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="perception-section">
                <div className="confidence-header">
                  <h5>AI Recommendation Confidence</h5>
                  <span className="confidence-percent">{analysis.ai_recommendation_confidence}%</span>
                </div>
                <div className="confidence-track">
                  <div 
                    className="confidence-fill"
                    style={{ 
                      width: `${analysis.ai_recommendation_confidence}%`,
                      background: getConfidenceColor(analysis.ai_recommendation_confidence)
                    }}
                  />
                </div>
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#EF4444' }}>
              Perception analysis failed to process.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onClose}>Close Overview</button>
          <button 
            className="modal-apply-btn" 
            onClick={() => { onClose(); onFixTrigger(product); }}
            disabled={loading}
          >
            Run Auto-Fix Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
