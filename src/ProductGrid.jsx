import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Sparkles, Loader2, FileText, Send, User, Bot, X, Wand2, Mail, MessageSquare, Info, Star, ShieldCheck, Cpu } from 'lucide-react';
import { generateProductDescription } from './utils/gemini';

export default function ProductGrid({ products, gaps, onProductSelect }) {
  const [descriptions, setDescriptions] = useState({});

  const handleImageClick = (product) => {
    if (onProductSelect) onProductSelect(product);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '40px'
      }}>
        {products.map((product, index) => {
          const currDescription = descriptions[product.title] || product.description;

          return (
            <div 
              key={index} 
              className="product-card" 
              style={{
                background: 'var(--bg-card)',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                cursor: 'pointer'
              }}
              onClick={() => handleImageClick(product)}
            >
              <div 
                className="image-container"
                style={{ 
                  width: '100%', 
                  aspectRatio: '1 / 1', 
                  position: 'relative',
                  background: 'rgba(255,255,255,0.02)',
                  overflow: 'hidden'
                }}
              >
                <img 
                  src={product.image || "https://placehold.co/600x600/1e293b/94a3b8?text=Image+Missing"} 
                  alt={product.title} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: '24px 24px 0 0'
                  }} 
                />
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>{product.title}</h3>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-color)', whiteSpace: 'nowrap' }}>
                    {product.price || '—'}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '14px', 
                    color: 'var(--text-muted)', 
                    lineHeight: '1.6',
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {currDescription || "What is this product about?"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
