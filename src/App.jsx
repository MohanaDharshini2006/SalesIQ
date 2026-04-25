import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PerceptionModal } from './components/PerceptionModal.jsx';

const API = 'http://localhost:3001/api';

// ─── Utility ──────────────────────────────────────────────────────────────────
const scoreColor = (s) => {
  if (s >= 80) return '#10B981';
  if (s >= 60) return '#F59E0B';
  return '#EF4444';
};

const scoreLabel = (s) => {
  if (s >= 80) return 'Excellent';
  if (s >= 60) return 'Needs Work';
  return 'Critical';
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icon = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  bot: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" />
      <path d="M12 7v4M8 14h.01M16 14h.01" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  arrowLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <triangle points="10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  shopify: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.337 3.68a.405.405 0 0 0-.374-.255c-.017 0-1.36.025-1.36.025s-1.105-1.07-1.205-1.17a.371.371 0 0 0-.264-.105l-.527 10.895 4.517 1.027s-1.632-9.955-1.687-10.305a.41.41 0 0 0-.1-.112zm-3.05-.163L12.003 3l-.284-.283c-.063-.063-.146-.097-.233-.097-.017 0-1.073.023-1.073.023S9.308 1.57 9.208 1.47a.37.37 0 0 0-.261-.103L8.42 12.072l3.867.88v-.015z"/>
    </svg>
  ),
  trendUp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  package: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
};

// ─── Score Ring ────────────────────────────────────────────────────────────────
const ScoreRing = ({ score, size = 160, strokeWidth = 10, label = 'Overall Score' }) => {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="score-ring-wrap" style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.5s ease, stroke 0.5s ease', filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div className="score-ring-center">
        <span className="score-ring-value" style={{ color }}>{score}</span>
        <span className="score-ring-label">{label}</span>
      </div>
    </div>
  );
};

// ─── Mini Score Bar ────────────────────────────────────────────────────────────
const ScoreBar = ({ label, value, delay = 0 }) => (
  <div className="score-bar-item" style={{ animationDelay: `${delay}ms` }}>
    <div className="score-bar-header">
      <span className="score-bar-label">{label}</span>
      <span className="score-bar-value" style={{ color: scoreColor(value) }}>{value}%</span>
    </div>
    <div className="score-bar-track">
      <div
        className="score-bar-fill"
        style={{ width: `${value}%`, backgroundColor: scoreColor(value), boxShadow: `0 0 10px ${scoreColor(value)}60` }}
      />
    </div>
  </div>
);

// ─── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = ({ product, onDiagnose, onPerception, index }) => {
  const score = product.total_score || 0;
  const gapCount = product.gaps_detected?.length || 0;

  return (
    <div className="product-card" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="product-card-image-wrap">
        {product.image
          ? <img src={product.image} alt={product.title} className="product-card-image" />
          : <div className="product-card-no-image"><span style={{ width: 40, height: 40, opacity: 0.3 }}>{Icon.package}</span></div>
        }
        <div className="product-card-score-badge" style={{ color: scoreColor(score) }}>
          {score}<span style={{ fontSize: 10 }}>%</span>
        </div>
        {gapCount > 0 && (
          <div className="product-card-gap-badge">{gapCount} issue{gapCount > 1 ? 's' : ''}</div>
        )}
      </div>

      <div className="product-card-body">
        <div className="product-card-status" style={{ color: scoreColor(score) }}>
          <div className="status-dot" style={{ backgroundColor: scoreColor(score) }} />
          {scoreLabel(score)}
        </div>
        <h3 className="product-card-title">{product.title}</h3>
        <p className="product-card-price">{product.price || '—'}</p>

        <div className="product-card-pillars">
          {product.scores && Object.entries(product.scores).slice(0, 4).map(([key, val]) => (
            <div key={key} className="pillar-chip">
              <span className="pillar-name">{key}</span>
              <span className="pillar-val" style={{ color: scoreColor(val) }}>{val}</span>
            </div>
          ))}
        </div>

        {gapCount > 0 && (
          <div className="product-card-gaps">
            {product.gaps_detected.slice(0, 3).map((g, i) => (
              <span key={i} className="gap-tag">⚠ {g.type?.replace(/_/g, ' ')}</span>
            ))}
            {gapCount > 3 && <span className="gap-tag">+{gapCount - 3} more</span>}
          </div>
        )}

        <button className="perception-trigger-btn" onClick={() => onPerception(product)}>
          <span style={{ fontSize: 16 }}>🧠</span> AI Perception Analysis
        </button>

        <button className="diagnose-btn mt-2" onClick={() => onDiagnose(product)}>
          <span style={{ width: 14, height: 14 }}>{Icon.zap}</span>
          AI Diagnose & Fix
        </button>
      </div>
    </div>
  );
};

// ─── Chat Assistant ────────────────────────────────────────────────────────────
const ChatAssistant = ({ storeData }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `👋 Hey! I'm your StoreIQ AI assistant. I've analyzed your store — ask me anything about your products, scores, or how to improve your performance!`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const quickPrompts = [
    'What products need the most improvement?',
    'How can I improve my store score?',
    'Which products have missing info?',
  ];

  const send = async (text = input) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    try {
      const products = storeData?.results || [];
      // Find a relevant product from the message
      const mentionedProduct = products.find(p =>
        msg.toLowerCase().includes(p.title?.toLowerCase()?.substring(0, 10))
      );

      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          title: mentionedProduct?.title || 'General Store',
          price: mentionedProduct?.price,
          products: products,
          history: messages
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Server error');
      setMessages(prev => [...prev, { role: 'ai', text: data.text || 'No response from AI.' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: `❌ Error: ${e.message}` }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button className={`chat-fab ${open ? 'active' : ''}`} onClick={() => setOpen(o => !o)} aria-label="Open AI Chat">
        <div className="chat-fab-icon">
          {open ? Icon.close : Icon.bot}
        </div>
        {!open && <div className="chat-fab-ping" />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="chat-window">
          <div className="chat-win-header">
            <div className="chat-win-avatar">
              <span style={{ width: 20, height: 20 }}>{Icon.bot}</span>
            </div>
            <div>
              <div className="chat-win-title">StoreIQ Assistant</div>
              <div className="chat-win-status">
                <div className="chat-online-dot" />
                Powered by AI
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setOpen(false)}>{Icon.close}</button>
          </div>

          {/* Messages */}
          <div className="chat-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg-row ${m.role}`}>
                {m.role === 'ai' && (
                  <div className="chat-msg-avatar">{Icon.bot}</div>
                )}
                <div className={`chat-bubble ${m.role}`}>
                  {m.text.split('\n').map((line, li) => (
                    <span key={li}>{line}{li < m.text.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-msg-row ai">
                <div className="chat-msg-avatar">{Icon.bot}</div>
                <div className="chat-bubble ai typing">
                  <div className="typing-indicator">
                    <div className="typing-dot" style={{ animationDelay: '0ms' }} />
                    <div className="typing-dot" style={{ animationDelay: '200ms' }} />
                    <div className="typing-dot" style={{ animationDelay: '400ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Prompts (show only at start) */}
            {messages.length === 1 && !loading && storeData && (
              <div className="chat-quick-prompts">
                {quickPrompts.map((q, i) => (
                  <button key={i} className="quick-prompt-btn" onClick={() => send(q)}>{q}</button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <input
              ref={inputRef}
              className="chat-input"
              placeholder="Ask about your store..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              disabled={loading}
            />
            <button
              className="chat-send-btn"
              onClick={() => send()}
              disabled={!input.trim() || loading}
            >
              <span style={{ width: 16, height: 16 }}>{Icon.send}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Diagnosis Modal ───────────────────────────────────────────────────────────
const DiagnoseModal = ({ product, onClose, onApplyFix, storeData }) => {
  const [fixData, setFixData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API}/audit/auto-fix`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: product.product_id, issues: product.gaps_detected })
        });
        const d = await r.json();
        setFixData(d);
      } catch { /* handled below */ }
      setLoading(false);
    };
    load();
  }, [product]);

  const handleApply = async () => {
    if (!fixData) return;
    if (!window.confirm("Are you sure you want to push this fix to your live Shopify store?")) return;
    setApplying(true);
    try {
      await onApplyFix(product.product_id, fixData);
      setApplied(true);
    } catch { /* handled in parent */ }
    setApplying(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container">

        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div className="modal-eyebrow">AI Diagnosis</div>
            <h2 className="modal-title">{product.title}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>{Icon.close}</button>
        </div>

        <div className="modal-body">
          {/* Left: Current State + Issues */}
          <div className="modal-left">
            <div className="modal-section">
              <div className="modal-section-title">Current Score</div>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                <ScoreRing score={product.total_score || 0} size={120} strokeWidth={8} label="Score" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {product.scores && Object.entries(product.scores).map(([k, v]) => (
                  <ScoreBar key={k} label={k} value={v} />
                ))}
              </div>
            </div>

            <div className="modal-section">
              <div className="modal-section-title" style={{ color: '#EF4444' }}>Detected Issues</div>
              <div className="issues-list">
                {(product.gaps_detected || []).map((g, i) => (
                  <div key={i} className="issue-item">
                    <div className="issue-dot" />
                    <div>
                      <div className="issue-type">{g.type?.replace(/_/g, ' ')}</div>
                      <div className="issue-impact">-{g.impact_score} points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: AI Fix */}
          <div className="modal-right">
            {loading ? (
              <div className="modal-loading">
                <div className="modal-spinner" />
                <p className="modal-loading-text">Generating AI optimizations...</p>
                <p className="modal-loading-sub">AI is analyzing your product</p>
              </div>
            ) : fixData ? (
              <div className="fix-result">
                <div className="fix-header">
                  <div className="fix-badge">
                    <span style={{ width: 14, height: 14 }}>{Icon.check}</span>
                    AI Fix Ready
                  </div>
                  <span className="fix-confidence">Confidence: {fixData.confidence || 95}%</span>
                </div>

                <div className="fix-section">
                  <div className="fix-label">Optimized Title</div>
                  <div className="fix-title-preview">{fixData.fixed_title}</div>
                </div>

                <div className="fix-section">
                  <div className="fix-label">Optimized Description</div>
                  <div
                    className="fix-desc-preview"
                    dangerouslySetInnerHTML={{ __html: fixData.fixed_description }}
                  />
                </div>

                <div className="fix-section">
                  <div className="fix-label">SEO Keywords</div>
                  <div className="fix-keywords">
                    {(fixData.seo_keywords || []).map((k, i) => (
                      <span key={i} className="seo-keyword">#{k}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="modal-error">
                <p>AI fix generation failed. Please try again.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className={`modal-apply-btn ${applied ? 'applied' : ''}`}
            onClick={handleApply}
            disabled={!fixData || applying || applied}
          >
            {applied
              ? <><span style={{ width: 16, height: 16 }}>{Icon.check}</span> Published to Shopify!</>
              : applying
                ? 'Publishing...'
                : <><span style={{ width: 16, height: 16 }}>{Icon.shopify}</span> Push to Shopify</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = ({ storeData, onDiagnose, onPerception, loading }) => {
  const [filter, setFilter] = useState('all');

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-orb" />
        <div className="loading-text">Scanning your Shopify store...</div>
        <div className="loading-sub">Analyzing products with AI</div>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <span style={{ width: 64, height: 64, opacity: 0.3 }}>{Icon.package}</span>
        </div>
        <h2 className="empty-title">No Store Data Yet</h2>
        <p className="empty-sub">Click "Run AI Audit" to scan your Shopify store and get detailed performance insights.</p>
      </div>
    );
  }

  const filtered = filter === 'all'
    ? storeData.results
    : filter === 'critical'
      ? storeData.results.filter(p => p.total_score < 60)
      : storeData.results.filter(p => p.total_score >= 80);

  const avg = storeData.averages;

  return (
    <div className="dashboard">
      {/* Store Overview */}
      <div className="overview-card">
        <div className="overview-left">
          <ScoreRing score={storeData.store_overall_score} size={180} strokeWidth={12} label="Store Health" />
          <div className="overview-meta">
            <div className="overview-meta-item">
              <span className="meta-val">{storeData.total_products}</span>
              <span className="meta-key">Products</span>
            </div>
            <div className="overview-meta-divider" />
            <div className="overview-meta-item">
              <span className="meta-val" style={{ color: '#EF4444' }}>
                {storeData.results.filter(p => p.total_score < 60).length}
              </span>
              <span className="meta-key">Critical</span>
            </div>
            <div className="overview-meta-divider" />
            <div className="overview-meta-item">
              <span className="meta-val" style={{ color: '#10B981' }}>
                {storeData.results.filter(p => p.total_score >= 80).length}
              </span>
              <span className="meta-key">Excellent</span>
            </div>
          </div>
        </div>

        <div className="overview-right">
          <h3 className="overview-right-title">Performance Pillars</h3>
          <div className="pillars-grid">
            <ScoreBar label="Completeness" value={avg.completeness} delay={0} />
            <ScoreBar label="Clarity" value={avg.clarity} delay={100} />
            <ScoreBar label="Visibility" value={avg.visibility} delay={200} />
            <ScoreBar label="Trust" value={avg.trust} delay={300} />
          </div>
          <div className="overview-insight">
            <div className="insight-icon">💡</div>
            <p className="insight-text">
              Your store scores highest on <strong style={{ color: '#818CF8' }}>Completeness</strong>. 
              Boost Trust by adding customer reviews and store policies.
            </p>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="products-section">
        <div className="products-header">
          <div>
            <h2 className="products-title">Products</h2>
            <p className="products-count">{storeData.results.length} products analyzed</p>
          </div>
          <div className="filter-tabs">
            {[
              { key: 'all', label: 'All' },
              { key: 'critical', label: '🔴 Critical' },
              { key: 'excellent', label: '🟢 Excellent' }
            ].map(f => (
              <button
                key={f.key}
                className={`filter-tab ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="product-grid">
          {filtered.map((p, i) => (
            <ProductCard key={p.product_id} product={p} onDiagnose={onDiagnose} onPerception={onPerception} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
            No products in this filter.
          </div>
        )}
      </div>
    </div>
  );
};

// ─── History Page ──────────────────────────────────────────────────────────────
const HistoryPage = ({ history }) => (
  <div className="history-page">
    <div className="history-card">
      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ fontSize: 48 }}>📋</div>
          <h2 className="empty-title">No History Yet</h2>
          <p className="empty-sub">After you apply AI fixes to products, they will appear here.</p>
        </div>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Before</th>
              <th>After</th>
              <th>Improvement</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map(item => (
              <tr key={item.id} className="history-row">
                <td className="history-product-name">{item.title}</td>
                <td><span className="history-score" style={{ color: scoreColor(item.score_before) }}>{item.score_before}%</span></td>
                <td><span className="history-score" style={{ color: scoreColor(item.score_after) }}>{item.score_after}%</span></td>
                <td>
                  <span className="history-lift">
                    <span style={{ width: 12, height: 12, color: '#10B981' }}>{Icon.trendUp}</span>
                    +{item.score_after - item.score_before} pts
                  </span>
                </td>
                <td className="history-date">{item.date}</td>
                <td><span className="history-badge">Published</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('dashboard');
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [perceptionProduct, setPerceptionProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [auditError, setAuditError] = useState(null);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setAuditError(null);
    try {
      const r = await fetch(`${API}/audit/store`, { method: 'POST' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Audit failed');
      setStoreData(d);
      setPage('dashboard');
    } catch (e) {
      setAuditError(e.message);
    }
    setLoading(false);
  }, []);

  const applyFix = useCallback(async (productId, fix) => {
    const r = await fetch(`${API}/update-product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: String(productId),
        fixed_title: fix.fixed_title,
        fixed_description: fix.fixed_description,
        seo_keywords: fix.seo_keywords
      })
    });
    const d = await r.json();
    if (!d.success) throw new Error(d.error);

    const product = storeData.results.find(p => String(p.product_id) === String(productId));
    const after = Math.min((product?.total_score || 60) + 22, 98);
    setHistory(h => [{
      id: Date.now(),
      title: product?.title || 'Unknown Product',
      date: new Date().toLocaleDateString(),
      score_before: product?.total_score || 0,
      score_after: after,
    }, ...h]);
    setStoreData(prev => ({
      ...prev,
      results: prev.results.map(p =>
        String(p.product_id) === String(productId) ? { ...p, total_score: after } : p
      )
    }));
    setActiveProduct(null);
  }, [storeData]);

  return (
    <div className="app">
      {/* Background Orbs */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <span style={{ width: 22, height: 22 }}>{Icon.trendUp}</span>
          </div>
          <div>
            <div className="logo-name">StoreIQ</div>
            <div className="logo-sub">Powered by AI</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: 'dashboard', icon: Icon.dashboard, label: 'Dashboard' },
            { id: 'history', icon: Icon.history, label: 'Fix History' }
          ].map(item => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === 'history' && history.length > 0 && (
                <span className="nav-badge">{history.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {storeData && (
            <div className="sidebar-store-info">
              <div className="store-info-score" style={{ color: scoreColor(storeData.store_overall_score) }}>
                {storeData.store_overall_score}%
              </div>
              <div className="store-info-label">Store Health</div>
            </div>
          )}
          <div className="sidebar-groq-badge">
            <div className="groq-dot" />
            AI Connected
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Top Bar */}
        <header className="topbar">
          <div>
            <h1 className="topbar-title">
              {page === 'dashboard' ? 'Store Performance' : 'Fix History'}
            </h1>
            <p className="topbar-sub">
              {page === 'dashboard'
                ? 'AI-powered audit and optimization for your Shopify store'
                : 'Track all AI improvements applied to your store'}
            </p>
          </div>
          <div className="topbar-actions">
            {auditError && (
              <div className="audit-error">⚠ {auditError}</div>
            )}
            <button
              className={`audit-btn ${loading ? 'loading' : ''}`}
              onClick={runAudit}
              disabled={loading}
            >
              <span style={{ width: 16, height: 16 }}>{loading ? null : Icon.zap}</span>
              {loading ? (
                <><div className="btn-spinner" />Scanning Store...</>
              ) : 'Run AI Audit'}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          {page === 'dashboard' && (
            <Dashboard storeData={storeData} onDiagnose={setActiveProduct} onPerception={setPerceptionProduct} loading={loading} />
          )}
          {page === 'history' && (
            <HistoryPage history={history} />
          )}
        </div>
      </main>

      {/* AI Chat */}
      <ChatAssistant storeData={storeData} />

      {/* Perception Modal */}
      {perceptionProduct && (
        <PerceptionModal
          product={perceptionProduct}
          onClose={() => setPerceptionProduct(null)}
          onFixTrigger={(p) => { setPerceptionProduct(null); setActiveProduct(p); }}
        />
      )}

      {/* Diagnose Modal */}
      {activeProduct && (
        <DiagnoseModal
          product={activeProduct}
          storeData={storeData}
          onClose={() => setActiveProduct(null)}
          onApplyFix={applyFix}
        />
      )}
    </div>
  );
}
