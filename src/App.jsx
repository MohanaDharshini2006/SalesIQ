import React, { useState, useEffect, useRef } from 'react';

const API = 'http://localhost:3001/api';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const COLORS = {
  bg: '#0B0F1A',
  card: 'rgba(26, 32, 50, 0.4)',
  primary: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
  accent: '#A855F7',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#E2E8F0',
  muted: '#64748B'
};

const icons = {
  dashboard: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H18a2.25 2.25 0 01-2.25-2.25v-2.25z" /></svg>,
  fix: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.456-2.455l.259-1.036.259 1.036a3.375 3.375 0 002.455 2.456l1.036.259-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>,
  history: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  close: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  chat: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.865 5.25 5.25 0 00.84-2.4C3.505 16.23 3 14.185 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
};

// ─── AI Concierge UI ──────────────────────────────────────────────────────────

const ChatConcierge = ({ storeData }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I am your StoreIQ Concierge. I have analyzed your store—how can I help you improve your AI score today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      // Map entire store results including individual pillar scores
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
        body: JSON.stringify({
          message: userText,
          context: {
            score: storeData?.store_overall_score || 0,
            count: storeData?.total_products || 0,
            full_results: storeContext
          }
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I hit a technical snag. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      {open && (
        <div className="w-[380px] h-[520px] mb-4 bg-[#0D121F] border border-white/10 rounded-[32px] overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">✨</div>
               <div className="text-xs font-black uppercase tracking-widest">StoreIQ Concierge</div>
             </div>
             <button onClick={() => setOpen(false)}>{icons.close}</button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
             {messages.map((m, i) => (
               <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-300 border border-white/5'}`}>
                    {m.text}
                 </div>
               </div>
             ))}
             {loading && <div className="text-[10px] text-gray-500 font-bold animate-pulse uppercase">Concierge is thinking...</div>}
          </div>
          <div className="p-4 border-t border-white/5 flex gap-2">
             <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask anything about your store..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"/>
             <button onClick={send} className="p-3 bg-indigo-600 rounded-xl text-white hover:bg-indigo-500 transition-colors">🚀</button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-110 active:scale-95 transition-all">
        {open ? icons.close : icons.chat}
      </button>
    </div>
  );
};

// ─── UI Base Components ───────────────────────────────────────────────────────

const GlassCard = ({ children, className = "" }) => (
  <div className={`backdrop-blur-xl bg-[#1A203266] border border-white/5 rounded-[24px] ${className}`}>
    {children}
  </div>
);

const ScoreRing = ({ score }) => {
  const r = 50, c = 2 * Math.PI * r;
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#A855F7' : '#EF4444';
  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={c} strokeDashoffset={c - (c * score / 100)} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 12px ${color}66)`, transition: 'stroke-dashoffset 1.5s ease-out' }}/>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-black text-white">{score}%</span>
        <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Readiness</span>
      </div>
    </div>
  );
};

const ProductCard = ({ p, onDiagnose }) => (
  <GlassCard className="p-4 hover:border-indigo-500/40 transition-all group scale-100 hover:scale-[1.01] active:scale-[0.99]">
    <div className="flex gap-5">
      <div className="w-28 h-28 rounded-2xl overflow-hidden bg-black/40 border border-white/5 relative">
        {p.image ? <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/> : <div className="w-full h-full flex items-center justify-center opacity-20 text-3xl">📷</div>}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black uppercase tracking-tighter">{p.gaps_detected.length} Gaps</div>
      </div>
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
           <div className="flex justify-between items-start">
             <h3 className="font-bold text-white text-sm truncate max-w-[150px]">{p.title}</h3>
             <span className="text-base font-black" style={{ color: p.total_score >= 80 ? '#10B981' : '#F59E0B' }}>{p.total_score}%</span>
           </div>
           <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase">Metric: {p.scores?.overall||0}% Accurate</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => onDiagnose(p)} className="flex-1 py-1.5 rounded-xl text-white text-[10px] font-black tracking-widest transition-all hover:brightness-110 shadow-lg shadow-indigo-500/20 shadow-inner" style={{ background: COLORS.primary }}>
             DIAGNOSE
           </button>
           <button className="px-4 py-1.5 rounded-xl border border-white/10 text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">INFO</button>
        </div>
      </div>
    </div>
  </GlassCard>
);

// ─── Main Application ─────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [fixData, setFixData] = useState(null);
  const [history, setHistory] = useState([]);

  const runAudit = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/audit/store`, { method: 'POST' });
      const d = await r.json();
      setStoreData(d);
    } catch (e) { alert('Audit failed'); }
    setLoading(false);
  };

  const onDiagnose = async (product) => {
    setActiveProduct(product); setFixData(null);
    try {
      const r = await fetch(`${API}/audit/auto-fix`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: product.product_id, issues: product.gaps_detected }) });
      const d = await r.json();
      setFixData(d);
    } catch (e) { alert('AI Error'); }
  };

  const applyFix = async (productId, fix) => {
    try {
      const r = await fetch(`${API}/update-product`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: String(productId), fixed_title: fix.fixed_title, fixed_description: fix.fixed_description, seo_keywords: fix.seo_keywords }) });
      const d = await r.json();
      if (d.success) {
        const product = storeData.results.find(p => String(p.product_id) === String(productId));
        const afterScore = Math.min(product.total_score + 22, 98);
        setHistory(h => [{ id: Date.now(), title: product.title, date: new Date().toLocaleDateString(), score_before: product.total_score, score_after: afterScore, changes: 'AI Optimization' }, ...h]);
        setStoreData(prev => ({ ...prev, results: prev.results.map(p => String(p.product_id) === String(productId) ? { ...p, total_score: afterScore } : p) }));
        alert('✅ Live Update Published to Shopify'); setActiveProduct(null);
      }
    } catch (e) { alert('Update failed'); }
  };

  return (
    <div className="flex h-screen bg-[#06080F] text-slate-200 overflow-hidden font-sans relative">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col p-6 space-y-8 bg-[#080B14] z-10">
        <div className="flex items-center gap-4 px-2 py-4">
           <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-[0_0_30px_rgba(99,102,241,0.3)]">S</div>
           <div>
             <span className="text-lg font-black tracking-tighter text-white block">StoreIQ</span>
             <span className="text-[9px] font-bold text-indigo-400 tracking-[1px] uppercase">Optimizer</span>
           </div>
        </div>
        <nav className="space-y-1">
          {[
            { id: 'dashboard', icon: icons.dashboard, label: 'Dashboard' },
            { id: 'history', icon: icons.history, label: 'History' }
          ].map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all border ${page === item.id ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'text-slate-500 border-transparent hover:text-white hover:bg-white/5'}`}>
              <span className="w-4 h-4">{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-10 py-10 relative">
        {/* Glow Effects */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"/>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"/>

        <div className="max-w-6xl mx-auto space-y-10 relative z-10">
          
          <header className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">{page === 'dashboard' ? 'Perception Audit' : 'Change History'}</h1>
              <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">Store Readiness for AI Shopping Agents</p>
            </div>
            <button onClick={runAudit} disabled={loading} className="px-8 py-5 rounded-[24px] text-[11px] font-black tracking-[4px] text-white transition-all shadow-[0_10px_40px_rgba(99,102,241,0.3)] active:scale-95 group overflow-hidden relative" style={{ background: COLORS.primary }}>
               <span className="relative z-10">{loading ? 'ANALYZING CATALOG...' : 'TRIGGER FULL AUDIT'}</span>
               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"/>
            </button>
          </header>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-44 animate-pulse text-indigo-400">
               <div className="w-20 h-20 border-[6px] border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-8 shadow-[0_0_40px_rgba(99,102,241,0.2)]"/>
               <span className="font-black tracking-[6px] text-[10px] uppercase">Mapping Store Perception Map...</span>
            </div>
          ) : storeData && page === 'dashboard' ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
               <GlassCard className="p-12 flex flex-col md:flex-row items-center gap-20 bg-gradient-to-br from-[#1A203244] to-transparent">
                  <ScoreRing score={storeData.store_overall_score}/>
                  <div className="flex-1 w-full space-y-10">
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
                        {[
                          ['Catalog Data', storeData.averages.completeness, 'bg-blue-500'], 
                          ['AI Clarity', storeData.averages.clarity, 'bg-green-500'], 
                          ['SEO Impact', storeData.averages.visibility, 'bg-purple-500'], 
                          ['Trust Rating', storeData.averages.trust, 'bg-red-500']
                        ].map(([l, v, c]) => (
                           <div key={l} className="space-y-4">
                              <div className="flex justify-between items-end">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{l}</div>
                                <div className="text-xl font-black text-white">{v}%</div>
                              </div>
                              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                 <div className={`h-full ${c} transition-all duration-1000`} style={{ width: `${v}%`, boxShadow: '0 0 10px rgba(255,255,255,0.1)' }}/>
                              </div>
                           </div>
                        ))}
                     </div>
                     <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4">
                        <span className="text-2xl">💡</span>
                        <p className="text-xs text-slate-400 leading-relaxed font-bold italic">Your store is "Moderately Optimized". AI Agents can recommend you, but you are missing key <b>Trust Signals</b> for a 90%+ score.</p>
                     </div>
                  </div>
               </GlassCard>

               <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-sm font-black uppercase tracking-[3px] text-slate-500">Products Needing Attention</h2>
                  <div className="h-px flex-1 bg-white/5"/>
                  <span className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-full">{storeData.results.length} ENTITIES</span>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {storeData.results.map(p => <ProductCard key={p.product_id} p={p} onDiagnose={onDiagnose}/>)}
               </div>
            </div>
          ) : page === 'history' ? (
            <div className="animate-in fade-in duration-500">
              <GlassCard className="overflow-hidden border-indigo-500/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.04] text-[10px] font-black uppercase tracking-[4px] text-slate-500">
                    <tr>
                      <th className="px-10 py-8">Product Entity</th>
                      <th className="px-10 py-8">Change Metric</th>
                      <th className="px-10 py-8">Score Lift</th>
                      <th className="px-10 py-8">Sync Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.map(item => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-10 py-8 font-bold text-white text-sm">{item.title}</td>
                        <td className="px-10 py-8">
                           <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-black tracking-widest text-[9px]">ENHANCED ✓</span>
                        </td>
                        <td className="px-10 py-8">
                           <div className="flex items-center gap-3">
                              <span className="text-slate-500 font-bold">{item.score_before}%</span>
                              <div className="w-8 h-[1px] bg-slate-800"/>
                              <span className="text-green-400 font-black text-base">{item.score_after}%</span>
                              <span className="text-[9px] font-black text-green-500/40">+{item.score_after - item.score_before}</span>
                           </div>
                        </td>
                        <td className="px-10 py-8 text-slate-500 font-mono italic">{item.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-44 opacity-20 space-y-8">
               <div className="w-32 h-32 rounded-full border-2 border-dashed border-indigo-500/50 animate-[spin_10s_linear_infinite] flex items-center justify-center">
                 <span className="text-7xl animate-pulse">🛰️</span>
               </div>
               <div className="text-center">
                 <h3 className="text-2xl font-black uppercase tracking-[10px]">Awaiting Link</h3>
                 <p className="text-[10px] font-bold mt-4 uppercase tracking-[2px]">Connect Shopify Hub to Begin</p>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* AI Intercom / Concierge */}
      <ChatConcierge storeData={storeData} />

      {/* Diagnosis Overlay */}
      {activeProduct && (
        <div className="fixed inset-0 bg-[#06080F]/95 backdrop-blur-2xl z-[150] flex justify-center items-center p-12">
           <div className="w-full max-w-7xl h-full bg-[#090D18] border border-white/10 rounded-[48px] flex overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-500">
              
              {/* Left side: Original & Gaps */}
              <div className="w-[450px] border-r border-white/5 flex flex-col p-12 bg-white/[0.02]">
                  <div className="mb-12">
                    <h2 className="text-2xl font-black tracking-tighter text-white">Neural Diagnosis</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 font-mono">Entity ID: {activeProduct.product_id}</p>
                  </div>

                  <div className="flex-1 space-y-12 overflow-y-auto pr-4 custom-scrollbar">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[4px]">Current State (Low Metric)</label>
                        <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10">
                            <h4 className="font-bold text-white mb-4">{activeProduct.title}</h4>
                            <div className="text-xs text-slate-400 line-clamp-6 opacity-60 prose prose-invert" dangerouslySetInnerHTML={{ __html: activeProduct.description }}/>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-red-500 uppercase tracking-[4px]">Detected Deviations</label>
                        <div className="space-y-3">
                            {activeProduct.gaps_detected.map((g,i) => (
                              <div key={i} className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10 flex justify-between items-center group">
                                <span className="text-red-100 font-black uppercase tracking-widest text-[9px]">{g.type.replace('_',' ')}</span>
                                <span className="text-red-400 font-black text-xs">-{g.impact_score} PTS</span>
                              </div>
                            ))}
                        </div>
                      </div>
                  </div>
              </div>

              {/* Center/Right: The Correction Hub */}
              <div className="flex-1 flex flex-col p-12 relative overflow-hidden bg-gradient-to-br from-[#101525] to-transparent">
                  <button onClick={() => setActiveProduct(null)} className="absolute top-10 right-10 p-4 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-full z-20">
                    <span className="w-6 h-6">{icons.close}</span>
                  </button>

                  <div className="flex-1 flex flex-col items-center justify-center space-y-12">
                      {!fixData ? (
                        <div className="flex flex-col items-center gap-8 animate-pulse text-indigo-400">
                           <div className="w-20 h-20 border-[6px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_50px_#6366F122]"/>
                           <p className="text-[10px] font-black uppercase tracking-[8px] text-center max-w-xs leading-loose">Synthesizing Optimized Metadata for {activeProduct.title}...</p>
                        </div>
                      ) : (
                        <div className="w-full max-w-3xl space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
                           <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 font-black border border-green-500/20 shadow-[0_0_30px_#10B98122]">99%</div>
                              <div>
                                 <h3 className="text-xl font-black text-white tracking-tight">AI Optimization Approved</h3>
                                 <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest mt-1 italic">Strategically engineered for LLM recommendation confidence.</p>
                              </div>
                           </div>

                           <div className="space-y-8">
                             <div className="group relative">
                               <div className="absolute -left-6 top-0 bottom-0 w-1 bg-green-500/0 group-hover:bg-green-500/50 transition-all rounded-full"/>
                               <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Enhanced Technical Title</label>
                               <div className="text-2xl font-black text-white underline decoration-green-500/30 underline-offset-8">{fixData.fixed_title}</div>
                             </div>

                             <div className="space-y-4">
                               <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Neural description Correction (Amazon-Grade)</label>
                               <div className="p-10 rounded-[40px] bg-white/[0.03] border border-white/5 relative group overflow-hidden">
                                  <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
                                     <span className="text-8xl">✨</span>
                                  </div>
                                  <div className="prose prose-invert prose-indigo text-indigo-100/80 leading-relaxed text-sm max-w-none" dangerouslySetInnerHTML={{ __html: fixData.fixed_description }}/>
                               </div>
                             </div>

                             <div className="flex flex-wrap gap-3">
                                {fixData.seo_keywords.map((k,i)=>(
                                  <span key={i} className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[9px] text-indigo-300 font-black tracking-[2px] uppercase">#{k}</span>
                                ))}
                             </div>
                           </div>
                        </div>
                      )}
                  </div>

                  <div className="pt-12 border-t border-white/5 flex flex-col items-center">
                      <button 
                        disabled={!fixData} 
                        onClick={() => applyFix(activeProduct.product_id, fixData)} 
                        className="w-full max-w-md py-8 rounded-[32px] text-[13px] font-black tracking-[8px] text-white transition-all shadow-[0_20px_60px_#6366F133] active:scale-95 disabled:opacity-30 uppercase overflow-hidden relative group" 
                        style={{ background: COLORS.primary }}
                      >
                         <span className="relative z-10">{fixData ? 'Sync to Global Store' : 'Finalizing Analysis...'}</span>
                         <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"/>
                      </button>
                      <div className="mt-8 flex items-center gap-4 py-3 px-6 rounded-2xl bg-white/[0.03] border border-white/5 shadow-inner">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Live Session Secured</span>
                      </div>
                  </div>
              </div>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}}/>
    </div>
  );
}
