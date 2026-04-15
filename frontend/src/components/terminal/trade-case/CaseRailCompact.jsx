import { useTerminal } from '../../../store/terminalStore';
import { useMemo } from 'react';
import { useTradingCases } from '../../../hooks/useTradingCases';

export default function CaseRailCompact() {
  const { state, dispatch } = useTerminal();
  const selectedCaseId = state.selectedCase?.id;
  const { cases: realCases, loading, error } = useTradingCases();

  const sortedCases = useMemo(() => {
    if (!realCases || realCases.length === 0) return [];
    const statusOrder = { ACTIVE: 0, CLOSED_WIN: 1, CLOSED_LOSS: 2, WATCHING: 3 };
    return [...realCases].sort((a, b) => (statusOrder[a.status] || 9) - (statusOrder[b.status] || 9));
  }, [realCases]);

  const handleCaseSelect = (caseData) => {
    dispatch({ type: 'SET_SELECTED_CASE', payload: caseData });
  };

  return (
    <div className="flex flex-col h-full bg-white" data-testid="case-rail-compact">
      <div className="px-4 py-2.5 border-b border-gray-200">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Cases ({sortedCases.length})
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-20">
            <span className="text-xs text-gray-400">Loading...</span>
          </div>
        )}
        {error && (
          <div className="px-3 py-2">
            <span className="text-xs text-red-500">Error: {error}</span>
          </div>
        )}
        {!loading && !error && sortedCases.length === 0 && (
          <div className="px-3 py-4 text-center">
            <span className="text-xs text-gray-400">No active cases</span>
          </div>
        )}
        {sortedCases.map((caseItem) => {
          const isSelected = selectedCaseId === caseItem.id;
          const isLong = caseItem.direction === 'LONG';

          return (
            <div
              key={caseItem.id}
              onClick={() => handleCaseSelect(caseItem)}
              className={`px-3 py-2.5 border-b border-gray-100 cursor-pointer transition-all duration-100 ${
                isSelected
                  ? (isLong ? 'bg-green-50 border-l-2 border-l-green-500' : 'bg-red-50 border-l-2 border-l-red-500')
                  : 'hover:bg-gray-50 border-l-2 border-l-transparent'
              }`}
              data-testid={`case-item-${caseItem.id}`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-gray-900">
                  {caseItem.symbol.replace('USDT', '')}
                </span>
                {caseItem.trade_count > 0 && (
                  <span className={`text-xs font-bold ${caseItem.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {caseItem.pnl >= 0 ? '+' : ''}{caseItem.pnl_pct?.toFixed(1) || '0.0'}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mb-0.5">
                {caseItem.status === 'ACTIVE' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                <span className={`text-xs font-medium ${isLong ? 'text-green-600' : 'text-red-600'}`}>
                  {caseItem.direction}
                </span>
                <span className="text-xs text-gray-300">|</span>
                <span className="text-xs text-gray-500">{caseItem.status === 'ACTIVE' ? 'ACTIVE' : caseItem.status}</span>
                <span className="text-xs text-gray-300">|</span>
                <span className="text-xs text-gray-400">{caseItem.trading_tf}</span>
              </div>
              <div className="text-xs text-gray-400">
                ${caseItem.entry_price?.toFixed(0) || '—'}
                {caseItem.duration && <> · {caseItem.duration}</>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
