import React, { useState, useEffect } from 'react';

export const HistoryDashboard = ({ storeDomain }) => {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeDomain) {
      fetchData();
    }
  }, [storeDomain]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [histRes, statsRes] = await Promise.all([
        fetch(`http://localhost:3001/api/history?store=${storeDomain}`),
        fetch(`http://localhost:3001/api/history/stats?store=${storeDomain}`)
      ]);
      const histData = await histRes.json();
      const statsData = await statsRes.json();
      setHistory(histData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', color: 'white' }}>
        <h2>Optimization History</h2>
        <div style={{ opacity: 0.5 }}>Loading history data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', color: 'white', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#f3f4f6' }}>
        ROI & Optimization History
      </h2>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <StatCard title="Total Fixed" value={stats.total_products_fixed} icon="📦" />
          <StatCard title="Avg Score Lift" value={`+${stats.avg_score_improvement}%`} icon="📈" color="#10B981" />
          <StatCard title="Best Improvement" value={`+${stats.best_improvement}%`} icon="🏆" color="#3B82F6" />
          <StatCard title="24h Activity" value={stats.recent_activity_count} icon="⚡" />
        </div>
      )}

      {/* History Table */}
      <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        {history.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9CA3AF' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <h3>No optimizations yet</h3>
            <p>Run the AI Auto-Fix on your products to start tracking ROI.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(0, 0, 0, 0.4)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9CA3AF' }}>
              <tr>
                <th style={{ padding: '16px' }}>Product</th>
                <th style={{ padding: '16px' }}>Date</th>
                <th style={{ padding: '16px' }}>Before Score</th>
                <th style={{ padding: '16px' }}>After Score</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Score Lift</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item._id} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>{item.product_title}</td>
                  <td style={{ padding: '16px', color: '#9CA3AF', fontSize: '14px' }}>
                    {new Date(item.timestamp).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}>
                      {item.before_score}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}>
                      {item.after_score}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <span style={{ color: '#10B981', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 7"/></svg>
                      +{item.score_improvement}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color = 'white' }) => (
  <div style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ fontSize: '32px' }}>{icon}</div>
    <div>
      <div style={{ fontSize: '13px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color }}>{value}</div>
    </div>
  </div>
);
