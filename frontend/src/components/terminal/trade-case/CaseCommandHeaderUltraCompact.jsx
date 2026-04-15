export default function CaseCommandHeaderUltraCompact({ caseData }) {
  if (!caseData) {
    return (
      <div className="bg-white px-4 py-2.5">
        <p className="text-xs text-gray-400">No case selected — open a trade to begin</p>
      </div>
    );
  }

  const isLong = caseData.direction === 'LONG';

  return (
    <div
      className="bg-white px-4 py-2.5"
      data-testid="case-command-header-ultra-compact"
      style={{ 
        fontFamily: 'Gilroy, sans-serif', 
        fontVariantNumeric: 'tabular-nums',
        borderLeft: `3px solid ${isLong ? '#16a34a' : '#dc2626'}`
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-gray-900">
            {caseData.symbol?.replace('USDT', '')}/USDT
          </h2>
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
            isLong ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {caseData.direction}
          </span>
          <span className="text-xs text-gray-400">{caseData.status}</span>
          {caseData.status === 'ACTIVE' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className={`font-bold ${(caseData.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(caseData.pnl || 0) >= 0 ? '+' : ''}{(caseData.pnl_pct || 0).toFixed(1)}%
          </span>
          <span className="text-gray-500">Entry: ${caseData.entry_price?.toFixed(2) || '—'}</span>
          <span className="text-gray-400">{caseData.trading_tf || '4H'}</span>
          <span className="text-gray-400">{caseData.trade_count || 0} exec</span>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
        <span><span className="text-gray-500 font-medium">Thesis:</span> {caseData.thesis || 'N/A'}</span>
        <span><span className="text-gray-500 font-medium">Strategy:</span> {caseData.strategy || 'N/A'}</span>
      </div>
    </div>
  );
}
