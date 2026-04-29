import React, { useState } from 'react';

export const ConnectStore = ({ onConnect }) => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [disconnectedMsg, setDisconnectedMsg] = useState(false);

  React.useEffect(() => {
    if (localStorage.getItem('storeiq_disconnected')) {
      setDisconnectedMsg(true);
      localStorage.removeItem('storeiq_disconnected');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!domain) {
      setError('Store domain is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/connect-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeDomain: domain }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Connection failed');
      
      onConnect(data.store);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="connect-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#000000', padding: '20px', color: 'white', fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
      <div className="bg-orb orb-1" style={{ position: 'absolute', top: '10%', left: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)' }} />
      <div className="bg-orb orb-2" style={{ position: 'absolute', bottom: '10%', right: '20%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(50px)' }} />
      
      <div className="connect-card" style={{ position: 'relative', zIndex: 10, background: 'rgba(255, 255, 255, 0.04)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '48px', width: '100%', maxWidth: '440px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', marginBottom: '24px', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '32px', height: '32px', color: 'white' }}>
              <path d="M15.337 3.68a.405.405 0 0 0-.374-.255c-.017 0-1.36.025-1.36.025s-1.105-1.07-1.205-1.17a.371.371 0 0 0-.264-.105l-.527 10.895 4.517 1.027s-1.632-9.955-1.687-10.305a.41.41 0 0 0-.1-.112zm-3.05-.163L12.003 3l-.284-.283c-.063-.063-.146-.097-.233-.097-.017 0-1.073.023-1.073.023S9.308 1.57 9.208 1.47a.37.37 0 0 0-.261-.103L8.42 12.072l3.867.88v-.015z" fill="white" stroke="none" />
            </svg>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Connect Your Shopify Store</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>Enter your Shopify store domain to seamlessly load your products.</p>
        </div>

        {disconnectedMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34D399', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16, flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            You have successfully disconnected your store.
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#FCA5A5', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16, flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shopify Store Domain</label>
            <input 
              type="text" 
              placeholder="my-store.myshopify.com" 
              value={domain} 
              onChange={e => setDomain(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' }}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%', padding: '14px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'transform 0.1s, box-shadow 0.2s', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)' }}
          >
            {loading ? (
              <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Connecting...</>
            ) : 'Connect Store'}
          </button>
        </form>
      </div>
    </div>
  );
};
