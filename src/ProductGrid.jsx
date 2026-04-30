import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Sparkles, Loader2, Wand2, ShieldCheck, ChevronRight } from 'lucide-react';

export default function ProductGrid({ products, onProductSelect, onUpdateProduct }) {
  const [diagnosing, setDiagnosing] = useState(null);

  const handleDiagnose = async (e, product) => {
    e.stopPropagation(); // Prevent card selection when clicking diagnose
    setDiagnosing(product.id);
    
    try {
      const response = await fetch('/api/shopify/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          title: product.title,
          description: product.description,
          image: product.image
        })
      });

      const data = await response.json();
      if (data.success && onUpdateProduct) {
        onUpdateProduct(product.id, data.newDescription);
      }
    } catch (err) {
      console.error('Diagnosis failed:', err);
    } finally {
      setDiagnosing(null);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '40px'
      }}>
        {products.map((product, index) => {
          const isMissingDesc = !product.description || product.description === 'No description' || product.description.length < 50;
          
          return (
            <div 
              key={product.id || index} 
              className="product-card" 
              style={{
                background: 'var(--bg-card)',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                cursor: 'pointer',
                position: 'relative'
              }}
              onClick={() => onProductSelect && onProductSelect(product)}
            >
              <div 
                className="image-container"
                style={{ 
                  width: '100%', 
                  aspectRatio: '16 / 10', 
                  position: 'relative',
                  background: 'rgba(255,255,255,0.02)',
                  overflow: 'hidden'
                }}
              >
                <img 
                  src={product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"} 
                  alt={product.title} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} 
                />
                <div className="card-overlay" style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  display: 'flex',
                  gap: '8px'
                }}>
                  {isMissingDesc ? (
                    <div className="status-badge warning">
                      <AlertCircle size={10} /> Needs Diagnosis
                    </div>
                  ) : (
                    <div className="status-badge success">
                      <ShieldCheck size={10} /> Optimized
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{product.title}</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ID: {product.id}
                    </div>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-color)', whiteSpace: 'nowrap' }}>
                    {product.price || '—'}
                  </div>
                </div>

                <div style={{ flex: 1, marginBottom: '24px' }}>
                  <p style={{ 
                    fontSize: '14px', 
                    color: 'var(--text-muted)', 
                    lineHeight: '1.6',
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }} dangerouslySetInnerHTML={{ __html: product.description }}>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="action-btn secondary"
                    style={{ flex: 1 }}
                    onClick={(e) => { e.stopPropagation(); onProductSelect(product); }}
                  >
                    Details <ChevronRight size={14} />
                  </button>
                  <button 
                    className={`action-btn ${diagnosing === product.id ? 'loading' : 'ai-gradient'}`}
                    style={{ flex: 1.5, gap: '8px' }}
                    onClick={(e) => handleDiagnose(e, product)}
                    disabled={diagnosing !== null}
                  >
                    {diagnosing === product.id ? (
                      <> <Loader2 className="animate-spin" size={16} /> Diagnosing...</>
                    ) : (
                      <> <Wand2 size={16} /> AI Diagnose</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

