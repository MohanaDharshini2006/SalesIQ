import React from 'react';

const scoreColor = (s) => {
  if (s >= 80) return '#10B981';
  if (s >= 60) return '#F59E0B';
  return '#EF4444';
};

export const StoreSummary = ({ data }) => {
  if (!data) return null;
  
  const { overall_score, ai_recommendation_confidence, summary } = data;
  
  return (
    <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', marginBottom: '32px' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '20px' }}>📊</span> Store Summary Dashboard
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        <div style={{ padding: '20px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Overall Score</div>
          <div style={{ fontSize: '36px', fontWeight: '700', color: scoreColor(overall_score) }}>{overall_score}%</div>
        </div>
        
        <div style={{ padding: '20px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>AI Confidence</div>
          <div style={{ fontSize: '36px', fontWeight: '700', color: scoreColor(ai_recommendation_confidence) }}>{ai_recommendation_confidence}%</div>
        </div>
        
        <div style={{ padding: '20px', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', gridColumn: 'span 2' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Top Issues Across Store</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px' }}>Missing Descriptions</span>
              <span style={{ fontWeight: '600', color: '#EF4444' }}>{summary.missing_descriptions_percent}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
              <div style={{ width: `${summary.missing_descriptions_percent}%`, height: '100%', background: '#EF4444', borderRadius: '3px' }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '15px' }}>Low Clarity</span>
              <span style={{ fontWeight: '600', color: '#F59E0B' }}>{summary.low_clarity_percent}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
              <div style={{ width: `${summary.low_clarity_percent}%`, height: '100%', background: '#F59E0B', borderRadius: '3px' }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '15px' }}>Low Trust Signals</span>
              <span style={{ fontWeight: '600', color: '#EF4444' }}>{summary.low_trust_percent}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
              <div style={{ width: `${summary.low_trust_percent}%`, height: '100%', background: '#EF4444', borderRadius: '3px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
