import React from 'react';

export const StoreOverview = ({ data }) => {
  const score = data.store_overall_score || 0;
  const avg = data.averages || {};

  let msg = 'Your store needs significant work.';
  if (score >= 80) msg = 'Your store is well optimized!';
  else if (score >= 60) msg = 'Your store is moderately optimized.';
  else if (score >= 40) msg = 'Your store needs improvement.';

  // SVG ring calculation
  const circumference = 2 * Math.PI * 44; // r=44
  const offset = circumference - (circumference * score / 100);

  return (
    <div className="bg-[#111827]/80 rounded-2xl p-8 border border-white/5 backdrop-blur-sm flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-56 h-56 bg-indigo-600/15 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-600/10 blur-3xl rounded-full pointer-events-none" />

      {/* Score Ring */}
      <div className="relative z-10 w-44 h-44 flex-shrink-0">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#1E293B" strokeWidth="10" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="url(#ringGrad)" strokeWidth="10"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1s ease' }} />
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="50%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white">{score}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Score</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 w-full z-10">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
          <h3 className="text-lg font-semibold">AI Readiness Score</h3>
          <span className="text-sm text-gray-400">{msg}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Pillar label="Completeness" value={avg.completeness} />
          <Pillar label="Clarity" value={avg.clarity} />
          <Pillar label="Visibility" value={avg.visibility} />
          <Pillar label="Trust" value={avg.trust} />
        </div>
      </div>
    </div>
  );
};

const Pillar = ({ label, value = 0 }) => {
  let barColor = 'bg-green-500';
  if (value < 80) barColor = 'bg-yellow-500';
  if (value < 60) barColor = 'bg-red-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <span className="text-xs font-bold text-white">{value}%</span>
      </div>
      <div className="w-full h-2 bg-[#1E293B] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
};
