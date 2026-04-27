import React, { useEffect, useState } from 'react';

export const ProtectedRoute = ({ children, onNotConnected, onConnected }) => {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    fetch('http://localhost:3001/api/connection-status')
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        setAuth(data.connected);
        if (data.connected && onConnected) onConnected(data.store);
        if (!data.connected && onNotConnected) onNotConnected();
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setAuth(false);
        if (onNotConnected) onNotConnected();
        setLoading(false);
      });
      
    return () => { isMounted = false; };
  }, [onNotConnected, onConnected]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10, 10, 15, 0.95)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(16, 185, 129, 0.2)', borderTopColor: '#10B981', animation: 'spin 1s linear infinite' }} />
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontFamily: 'Inter, sans-serif' }}>Verifying backend connection...</div>
        </div>
      </div>
    );
  }

  return auth ? children : null;
};
