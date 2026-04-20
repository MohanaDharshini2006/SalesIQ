import React from 'react';

const severityColor = (s) => {
  if (s === 'critical') return '#EF4444';
  if (s === 'high') return '#F59E0B';
  if (s === 'medium') return '#3B82F6';
  return '#6B7280';
};

export const FixPanel = ({ product, fixedData, onApplyFix, onCancel }) => {
  const issues = product.gaps_detected || [];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-end z-50">
      <div className="w-[460px] bg-[#111827] border-l border-white/5 h-full flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-base font-bold flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-indigo-500/20 flex items-center justify-center text-sm">✨</span>
            AI Suggested Fix
          </h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-white transition p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Before */}
          <section>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Current Product</h3>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="font-semibold text-sm text-white mb-1">{product.title}</div>
              <div className="text-xs text-gray-400 line-clamp-3">{product.description || 'No description available'}</div>
            </div>
          </section>

          {/* Issues */}
          <section>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Detected Issues ({issues.length})</h3>
            <div className="space-y-2">
              {issues.map((issue, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: severityColor(issue.severity) + '1A' }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: severityColor(issue.severity) }} />
                    </div>
                    <span className="text-xs font-medium text-gray-300">{(issue.type || '').replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold" style={{ color: severityColor(issue.severity) }}>+{issue.impact_score}</div>
                    <div className="text-[9px] text-gray-500 uppercase">{issue.severity}</div>
                  </div>
                </div>
              ))}
              {issues.length === 0 && <p className="text-xs text-gray-500 text-center py-3">No issues detected</p>}
            </div>
          </section>

          {/* AI Fix */}
          {!fixedData ? (
            <div className="flex flex-col items-center py-10">
              <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs text-indigo-400 font-medium">Generating AI fix...</span>
            </div>
          ) : (
            <section>
              <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Optimized Version
                <span className="ml-auto text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded">{fixedData.confidence}% confident</span>
              </h3>

              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 space-y-4">
                <div>
                  <div className="text-[9px] font-bold text-indigo-300 uppercase mb-1">New Title</div>
                  <div className="text-sm font-medium text-white">{fixedData.fixed_title}</div>
                </div>

                {fixedData.fixed_description && (
                  <div>
                    <div className="text-[9px] font-bold text-indigo-300 uppercase mb-1">New Description</div>
                    <div className="text-xs text-gray-300 bg-black/20 p-3 rounded-lg max-h-28 overflow-y-auto border border-white/5" dangerouslySetInnerHTML={{ __html: fixedData.fixed_description }} />
                  </div>
                )}

                <div>
                  <div className="text-[9px] font-bold text-indigo-300 uppercase mb-1.5">SEO Keywords</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(fixedData.seo_keywords || []).map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 text-[10px] font-semibold">{kw}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5">
          <button
            disabled={!fixedData}
            onClick={() => onApplyFix?.(product.product_id, fixedData)}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 disabled:opacity-40 text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex justify-center items-center gap-2"
          >
            Apply Fix to Shopify
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
