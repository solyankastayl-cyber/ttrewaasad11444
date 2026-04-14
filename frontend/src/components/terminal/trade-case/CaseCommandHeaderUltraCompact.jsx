export default function CaseCommandHeaderUltraCompact({ caseData }) {
  if (!caseData) {
    return (
      <div className="bg-neutral-50 px-4 py-2 border-b border-[#E5E7EB]">
        <p className="text-xs text-neutral-500">No case selected</p>
      </div>
    );
  }

  const isLong = caseData.direction === 'LONG';
  const bgColor = isLong ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isLong ? 'border-l-green-500' : 'border-l-red-500';

  return (
    <div
      className={`${bgColor} px-4 py-2 border-b border-[#E5E7EB]`}
      data-testid="case-command-header-ultra-compact"
      style={{ 
        fontFamily: 'Gilroy, sans-serif', 
        fontVariantNumeric: 'tabular-nums',
        borderLeft: `4px solid ${isLong ? '#10b981' : '#ef4444'}`
      }}
    >
      {/* Row 1: Title + Meta */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-neutral-900">
            {caseData.symbol.replace('USDT', '')} · #{caseData.id.replace('case_', '')}
          </h2>
          <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-neutral-500">LIVE</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-bold px-2 py-0.5 rounded-lg ${isLong ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {caseData.direction} {caseData.status}
          </span>
          <span className={`font-bold ${caseData.pnl >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {caseData.pnl >= 0 ? '+' : ''}{caseData.pnl_pct.toFixed(1)}%
          </span>
          <span className="text-neutral-600">{caseData.duration} · {caseData.trade_count} exec</span>
        </div>
      </div>

      {/* Row 2: Three core blocks inline */}
      <div className="flex items-start gap-6 text-xs">
        <div className="flex-1">
          <span className="font-bold text-neutral-500 uppercase">Why:</span>
          <span className="text-neutral-800 ml-1">{caseData.thesis || 'N/A'}</span>
        </div>
        <div className="flex-1">
          <span className="font-bold text-neutral-500 uppercase">Next:</span>
          <span className="text-neutral-800 ml-1">{caseData.next_action || 'Monitor'}</span>
        </div>
        <div className="flex-shrink-0">
          <span className="font-bold text-neutral-500 uppercase">Break:</span>
          <span className="text-neutral-800 ml-1">{caseData.direction === 'LONG' ? '↓' : '↑'} {caseData.stop || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
