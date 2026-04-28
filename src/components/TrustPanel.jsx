import React from 'react';

export const TrustPanel = ({ data }) => {
  if (!data) return null;
  
  const { has_shipping_policy, has_return_policy, has_privacy_policy, has_reviews, trust_score, missing } = data;
  
  const scoreColor = (s) => {
    if (s >= 80) return '#10B981';
    if (s >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getIcon = (hasIt) => hasIt ? '✅' : '❌';
  const getLabelColor = (hasIt) => hasIt ? '#10B981' : '#EF4444';

  return (
    <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🛡️</span> Trust & Policy Analysis
        </h3>
        <div style={{ fontSize: '24px', fontWeight: '700', color: scoreColor(trust_score) }}>
          Score: {trust_score}/100
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: `1px solid ${has_shipping_policy ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>{getIcon(has_shipping_policy)}</span>
          <span style={{ fontWeight: '500', color: getLabelColor(has_shipping_policy) }}>Shipping Policy</span>
        </div>
        
        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: `1px solid ${has_return_policy ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>{getIcon(has_return_policy)}</span>
          <span style={{ fontWeight: '500', color: getLabelColor(has_return_policy) }}>Return Policy</span>
        </div>
        
        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: `1px solid ${has_privacy_policy ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>{getIcon(has_privacy_policy)}</span>
          <span style={{ fontWeight: '500', color: getLabelColor(has_privacy_policy) }}>Privacy Policy</span>
        </div>
        
        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: `1px solid ${has_reviews ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>{getIcon(has_reviews)}</span>
          <span style={{ fontWeight: '500', color: getLabelColor(has_reviews) }}>Product Reviews</span>
        </div>
      </div>
      
      {missing && missing.length > 0 && (
        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px' }}>
          <div style={{ color: '#FCA5A5', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>⚠ Weak Trust Signals</div>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#FCA5A5', fontSize: '14px' }}>
            {missing.map((item, i) => (
              <li key={i}>Missing {item.replace('_', ' ')}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
