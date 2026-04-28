import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PerceptionModal } from './components/PerceptionModal.jsx';
import { ConnectStore } from './components/ConnectStore.jsx';
import { StoreSummary } from './components/StoreSummary.jsx';
import { TrustPanel } from './components/TrustPanel.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

const API = 'http://localhost:3001/api';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const COLORS = {
  bg: '#191B1C',
  card: '#222426',
  primary: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#EDEFF0',
  muted: '#9CA3AF'
};

const icons = {
  dashboard: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H18a2.25 2.25 0 01-2.25-2.25v-2.25z" /></svg>,
  fix: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>,
  history: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  back: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>,
  close: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  chat: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.865 5.25 5.25 0 00.84-2.4C3.505 16.23 3 14.185 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
};

// ─── AI Concierge UI ──────────────────────────────────────────────────────────
const ChatConcierge = ({ storeData }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello. I'm your StoreIQ Assistant. I've analyzed your store metrics—how can I help optimize your performance today?" }
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

  const send = async (textOverride) => {
    const userText = textOverride || input;
    if (!userText.trim() || loading) return;
    if (!textOverride) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const storeContext = storeData?.results.map(p => ({
        title: p.title,
        overall: p.total_score,
        completeness: p.scores.completeness,
        clarity: p.scores.clarity,
        visibility: p.scores.visibility,
        trust: p.scores.trust,
        issues: p.gaps_detected.map(g => g.type)
      })) || [];

      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, context: { score: storeData?.store_overall_score || 0, count: storeData?.total_products || 0, full_results: storeContext } })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Server error');
      setMessages(prev => [...prev, { role: 'ai', text: data.text || 'No response from AI.' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const quickActions = [
    "Explain my score",
    "How to improve trust?",
    "What should I fix first?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {open && (
        <div className="mb-4 w-[360px] h-[540px] border border-[#EDEFF0]/10 rounded-[12px] flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden bg-[#191B1C] animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="p-4 border-b border-[#EDEFF0]/10 flex items-center gap-3 bg-[#191B1C]">
            <div className="w-8 h-8 rounded-full bg-[#EDEFF0]/10 flex items-center justify-center text-[#EDEFF0] text-sm">✨</div>
            <div>
              <h3 className="font-semibold text-[#EDEFF0] text-sm">StoreIQ Assistant</h3>
              <p className="text-xs text-[#EDEFF0]/60">Ready to help</p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-[#EDEFF0]/60 hover:text-[#EDEFF0] transition-colors"><span className="w-5 h-5 block">{icons.close}</span></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-[12px] text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-[#EDEFF0] text-[#191B1C] rounded-br-sm' : 'bg-[#222426] text-[#EDEFF0]/90 border border-[#EDEFF0]/5 rounded-bl-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs font-medium text-[#EDEFF0]/50 animate-pulse">Typing...</div>}
            
            {messages.length === 1 && !loading && (
              <div className="flex flex-col gap-2 mt-4">
                {quickActions.map(action => (
                  <button key={action} onClick={() => send(action)} className="text-left px-4 py-2.5 rounded-[12px] text-xs font-medium text-[#EDEFF0]/80 border border-[#EDEFF0]/10 hover:bg-[#EDEFF0]/5 hover:text-[#EDEFF0] hover:border-[#EDEFF0]/20 transition-all">
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-[#191B1C] border-t border-[#EDEFF0]/10 flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask why your score is low..." className="flex-1 bg-[#222426] border border-[#EDEFF0]/10 rounded-[12px] px-4 py-2.5 text-sm text-[#EDEFF0] placeholder:text-[#EDEFF0]/40 focus:outline-none focus:border-[#EDEFF0]/40 transition-colors" />
            <button onClick={() => send()} className="w-10 h-10 rounded-[12px] bg-[#EDEFF0] flex items-center justify-center text-[#191B1C] hover:bg-[#d6d8d9] transition-all shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
              <svg className="w-4 h-4 translate-x-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      )}

      <button onClick={() => setOpen(!open)} className="w-14 h-14 rounded-full flex items-center justify-center text-[#191B1C] bg-[#EDEFF0] hover:bg-[#d6d8d9] shadow-[0_4px_10px_rgba(0,0,0,0.2)] transition-all active:scale-95">
        {open ? (
           <span className="w-6 h-6">{icons.close}</span>
        ) : (
           <span className="w-6 h-6">{icons.chat}</span>
        )}
      </button>
    </div>
  );
};

// ─── Shared Components ───────────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div className={`bg-[#222426] border border-white/5 rounded-2xl shadow-sm ${className}`}>
    {children}
  </div>
);

const MinimalScoreRing = ({ score }) => {
  const dash = (score / 100) * 251.2;
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90">
        <circle cx="64" cy="64" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
        <circle cx="64" cy="64" r="40" stroke="#EDEFF0" strokeWidth="6" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - dash} strokeLinecap="round" className="transition-all duration-[1s] ease-out" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-semibold text-white tracking-tight">{score}</span>
        <span className="text-xs text-slate-500 mt-1">Score</span>
      </div>
    </div>
  );
};

const ProductCard = ({ p, onDiagnose }) => (
  <Card className="p-6 flex flex-col gap-5 hover:border-white/10 transition-colors">
    <div className="flex gap-4">
      <div className="w-20 h-20 rounded-xl bg-[#191B1C] border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
        {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <span className="text-2xl opacity-50 text-slate-600">📦</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h4 className="font-semibold text-white text-base truncate">{p.title}</h4>
          <span className="text-sm font-semibold text-[#EDEFF0]">{p.total_score}%</span>
        </div>
        <p className="text-xs text-slate-500 mb-3 truncate">ID: {p.product_id}</p>
        <div className="flex items-center gap-2">
           <span className="px-2.5 py-1 bg-red-500/10 text-red-400 text-[10px] font-medium rounded-full border border-red-500/20">{p.gaps_detected.length} Issues</span>
        </div>
      </div>
    </div>
    <div className="flex gap-3 mt-auto">
      <button onClick={() => onDiagnose(p)} className="flex-1 px-4 py-2.5 rounded-[12px] text-[#191B1C] text-xs font-medium bg-[#EDEFF0] hover:bg-[#d6d8d9] transition-all shadow-[0_4px_10px_rgba(0,0,0,0.2)] text-center">
        Diagnose
      </button>
      <button className="px-5 py-2.5 rounded-[12px] border border-[#EDEFF0]/20 text-xs font-medium text-[#EDEFF0] hover:bg-[#EDEFF0]/5 hover:border-[#EDEFF0] transition-colors">
        Details
      </button>
    </div>
  </Card>
);

// ─── Main Application ─────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('dashboard');
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [perceptionProduct, setPerceptionProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [auditError, setAuditError] = useState(null);
  const [route, setRoute] = useState('/dashboard');
  const [storeDomain, setStoreDomain] = useState(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const navigate = (path) => {
    setRoute(path);
  };

  const handleSignOut = async () => {
    if (!window.confirm("Are you sure you want to disconnect your store?")) return;
    setIsDisconnecting(true);
    try {
      await fetch('http://localhost:3001/api/disconnect-store', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('storeiq_session');
    localStorage.setItem('storeiq_disconnected', 'true');
    setStoreDomain(null);
    setStoreData(null);
    setIsDisconnecting(false);
    navigate('/connect');
  };

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

  const onDiagnose = async (product) => {
    setActiveProduct(product); setFixData(null);
    try {
      const r = await fetch(`${API}/audit/auto-fix`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: product.product_id, issues: product.gaps_detected }) });
      const d = await r.json();
      setFixData(d);
    } catch (e) { alert('Analysis failed.'); }
  };

  const applyFix = async (productId, fix) => {
    try {
      const r = await fetch(`${API}/update-product`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: String(productId), fixed_title: fix.fixed_title, fixed_description: fix.fixed_description, seo_keywords: fix.seo_keywords }) });
      const d = await r.json();
      if (d.success) {
        const product = storeData.results.find(p => String(p.product_id) === String(productId));
        const afterScore = Math.min(product.total_score + 22, 98);
        setHistory(h => [{ id: Date.now(), title: product.title, date: new Date().toLocaleDateString(), score_before: product.total_score, score_after: afterScore, changes: 'Optimization Applied' }, ...h]);
        setStoreData(prev => ({ ...prev, results: prev.results.map(p => String(p.product_id) === String(productId) ? { ...p, total_score: afterScore } : p) }));
        alert('Update successful'); setActiveProduct(null);
      }
    } catch (e) { alert('Update failed.'); }
  };

  return (
    <div className="flex h-screen bg-[#191B1C] text-[#EDEFF0] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#191B1C] flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-[#EDEFF0] flex items-center justify-center text-[#191B1C] font-bold text-lg">S</div>
          <span className="text-lg font-semibold tracking-tight text-[#EDEFF0]">StoreIQ</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'dashboard', icon: icons.dashboard, label: 'Dashboard' },
            { id: 'history', icon: icons.history, label: 'Audit History' }
          ].map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${page === item.id ? 'bg-[#EDEFF0]/[0.08] text-[#EDEFF0]' : 'text-[#EDEFF0]/60 hover:text-[#EDEFF0] hover:bg-white/5'}`}>
              <span className="w-5 h-5">{item.icon}</span> {item.label}
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
          
          {/* Sign Out Button (Sidebar) */}
          {storeDomain && (
            <button 
              onClick={handleSignOut}
              disabled={isDisconnecting}
              style={{
                width: '100%',
                marginBottom: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#FCA5A5',
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: isDisconnecting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => !isDisconnecting && (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)')}
              onMouseOut={(e) => !isDisconnecting && (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
            >
              {isDisconnecting ? (
                 <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              )}
              {isDisconnecting ? 'Disconnecting...' : 'Sign Out'}
            </button>
          )}

          <div className="sidebar-groq-badge">
            <div className="groq-dot" />
            AI Connected
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#191B1C] p-8 md:p-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">{page === 'dashboard' ? 'Overview' : 'Change History'}</h1>
              <p className="text-sm text-slate-500 mt-1">Manage and optimize your store performance</p>
            </div>
            <button onClick={runAudit} disabled={loading} className="px-4 py-2.5 rounded-[12px] text-sm font-medium text-[#191B1C] bg-[#EDEFF0] hover:bg-[#d6d8d9] transition-all shadow-[0_4px_10px_rgba(0,0,0,0.2)] disabled:bg-[#2a2d2e] disabled:text-[#777] disabled:shadow-none">
              {loading ? 'Running audit...' : 'Run new audit'}
            </button>
          </div>
        </header>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
              <div className="w-8 h-8 border-2 border-[#EDEFF0]/20 border-t-[#EDEFF0] rounded-full animate-spin" />
              <span className="text-sm font-medium">Analyzing store data...</span>
            </div>
          ) : storeData && page === 'dashboard' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              <Card className="p-8 flex flex-col md:flex-row items-center gap-12">
                <MinimalScoreRing score={storeData.store_overall_score} />
                <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                    ['Catalog Depth', storeData.averages.completeness],
                    ['AI Perception', storeData.averages.clarity],
                    ['Search Impact', storeData.averages.visibility],
                    ['Trust Rating', storeData.averages.trust]
                  ].map(([l, v]) => (
                    <div key={l} className="space-y-2">
                      <div className="text-xs text-[#EDEFF0]/60 font-medium">{l}</div>
                      <div className="text-xl font-semibold text-[#EDEFF0]">{v}%</div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-[#EDEFF0]" style={{ width: `${v}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Needs Attention</h2>
                  <span className="text-xs font-medium text-slate-500 bg-white/5 px-3 py-1 rounded-full">{storeData.results.length} Products</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {storeData.results.map(p => <ProductCard key={p.product_id} p={p} onDiagnose={onDiagnose} />)}
                </div>
              </div>
            </div>
          ) : page === 'history' ? (
            <Card className="overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#191B1C] text-xs text-slate-400 border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-medium">Product</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Score Change</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-200">{item.title}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">Applied</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">{item.score_before}%</span>
                          <span className="text-slate-600">→</span>
                          <span className="text-green-400 font-medium">{item.score_after}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{item.date}</td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan="4" className="px-6 py-20 text-center text-slate-500 text-sm">No history available</td></tr>
                  )}
                </tbody>
              </table>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-slate-500">
              <div className="w-16 h-16 rounded-full border border-dashed border-slate-600 flex items-center justify-center mb-6">
                <span className="text-2xl opacity-50">📊</span>
              </div>
              <h3 className="text-lg font-medium text-slate-300">No Data Available</h3>
              <p className="text-sm mt-2">Run an audit to view your store's performance.</p>
            </div>
          )}
        </div>
      </main>

      {/* Unified Diagnosis Modal */}
      {activeProduct && (
        <div className="fixed inset-0 bg-[#06080F]/80 backdrop-blur-sm z-[300] flex justify-center items-center p-6">
          <div className="w-full max-w-5xl h-[80vh] min-h-[600px] bg-[#191B1C] border border-white/10 rounded-2xl flex overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Left Panel: Diagnosis */}
            <div className="w-1/2 border-r border-white/5 flex flex-col bg-[#1F2123]">
              <div className="p-6 border-b border-white/5 flex items-center gap-4">
                <button onClick={() => setActiveProduct(null)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-colors">
                  <span className="w-5 h-5 block">{icons.back}</span>
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-white">Diagnosis Details</h2>
                  <p className="text-xs text-slate-500">ID: {activeProduct.product_id}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                <section>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Current Content</h3>
                  <div className="p-5 rounded-xl bg-[#191B1C] border border-white/5">
                    <h4 className="font-medium text-white mb-3 text-sm">{activeProduct.title}</h4>
                    <div className="text-sm text-slate-400 line-clamp-6" dangerouslySetInnerHTML={{ __html: activeProduct.description }} />
                  </div>
                </section>
                <section>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Identified Issues</h3>
                  <div className="space-y-2">
                    {activeProduct.gaps_detected.map((g, i) => (
                      <div key={i} className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/10 flex justify-between items-center text-sm">
                        <span className="text-red-400 font-medium capitalize">{g.type.replace('_', ' ')}</span>
                        <span className="text-red-500 font-semibold">-{g.impact_score}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            {/* Right Panel: Resolution */}
            <div className="w-1/2 flex flex-col bg-[#191B1C] relative">
              <button onClick={() => setActiveProduct(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white transition-colors">
                <span className="w-5 h-5 block">{icons.close}</span>
              </button>
              
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar flex flex-col">
                <h3 className="text-lg font-semibold text-[#EDEFF0] mb-8">AI Optimization</h3>
                {!fixData ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <div className="w-8 h-8 border-2 border-[#EDEFF0]/20 border-t-[#EDEFF0] rounded-full animate-spin" />
                    <p className="text-sm font-medium">Generating improvements...</p>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Optimized Title</h4>
                      <div className="text-lg font-semibold text-white">{fixData.fixed_title}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Enhanced Description</h4>
                      <div className="p-5 rounded-xl bg-[#222426] border border-white/5 text-sm text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: fixData.fixed_description }} />
                    </div>
                    <div>
                       <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Keywords</h4>
                       <div className="flex flex-wrap gap-2">
                         {fixData.seo_keywords.map((k, i) => (
                           <span key={i} className="px-3 py-1 bg-[#EDEFF0]/10 text-[#EDEFF0] text-xs font-medium rounded-full border border-[#EDEFF0]/20">{k}</span>
                         ))}
                       </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-white/5 bg-[#1F2123]">
                <div className="flex gap-4">
                  <button onClick={() => setActiveProduct(null)} className="px-5 py-2.5 rounded-[12px] border border-[#EDEFF0]/20 text-[#EDEFF0] text-sm font-medium hover:bg-[#EDEFF0]/5 hover:border-[#EDEFF0] transition-colors">Cancel</button>
                  <button
                    disabled={!fixData}
                    onClick={() => applyFix(activeProduct.product_id, fixData)}
                    className="flex-1 px-4 py-2.5 rounded-[12px] text-sm font-medium text-[#191B1C] bg-[#EDEFF0] hover:bg-[#d6d8d9] transition-all shadow-[0_4px_10px_rgba(0,0,0,0.2)] disabled:bg-[#2a2d2e] disabled:text-[#777] disabled:shadow-none"
                  >
                    {fixData ? 'Apply changes' : 'Waiting for AI...'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ChatConcierge storeData={storeData} />

      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', system-ui, sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}} />
    </div>
    </ProtectedRoute>
  );
}
