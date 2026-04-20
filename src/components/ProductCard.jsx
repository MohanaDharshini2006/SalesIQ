import React from 'react';

export const ProductCard = ({ product, onDiagnose }) => {
  const score = product.total_score || 0;
  const issues = product.issues_count || 0;
  const hasImage = product.image && product.image.startsWith('http');

  let scoreBg = 'from-green-500/20 to-green-600/5 text-green-400';
  if (score < 80) scoreBg = 'from-yellow-500/20 to-yellow-600/5 text-yellow-400';
  if (score < 60) scoreBg = 'from-red-500/20 to-red-600/5 text-red-400';

  return (
    <div className="bg-[#111827]/80 rounded-2xl border border-white/5 overflow-hidden group hover:border-indigo-500/30 transition-all duration-300 backdrop-blur-sm flex flex-col">
      {/* Image */}
      <div className="h-40 relative bg-[#1E293B] overflow-hidden">
        {hasImage ? (
          <img src={product.image} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" alt={product.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}
        {issues > 0 && (
          <div className="absolute top-3 left-3 bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
            {issues} ISSUES
          </div>
        )}
        <div className={`absolute top-3 right-3 bg-gradient-to-br ${scoreBg} border border-white/10 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm`}>
          {score}%
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-white mb-1 truncate">{product.title}</h3>
        <p className="text-[10px] text-gray-500 font-mono mb-4">ID: {product.product_id}</p>

        <div className="mt-auto flex gap-2">
          <button
            onClick={() => onDiagnose(product)}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Diagnose
          </button>
          <button className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2 rounded-lg text-xs font-semibold transition-all border border-white/5">
            Details
          </button>
        </div>
      </div>
    </div>
  );
};
