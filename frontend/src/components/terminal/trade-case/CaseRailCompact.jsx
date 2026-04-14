import { useTerminal } from '../../../store/terminalStore';
import { useMemo } from 'react';
import { useTradingCases } from '../../../hooks/useTradingCases';

export default function CaseRailCompact() {
  const { state, dispatch } = useTerminal();
  const selectedCaseId = state.selectedCase?.id;
  
  // Fetch real cases from API
  const { cases: realCases, loading, error } = useTradingCases();

  // Sort: ACTIVE → CLOSED_WIN → CLOSED_LOSS → WATCHING
  const sortedCases = useMemo(() => {
    if (!realCases || realCases.length === 0) {
      return [];
    }
    
    const statusOrder = {
      ACTIVE: 0,
      CLOSED_WIN: 1,
      CLOSED_LOSS: 2,
      WATCHING: 3
    };

    return [...realCases].sort((a, b) => {
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [realCases]);

  const handleCaseSelect = (caseData) => {
    dispatch({
      type: 'SET_SELECTED_CASE',
      payload: caseData
    });
  };

  return (
    <div className="flex flex-col h-full bg-white" data-testid="case-rail-compact">
      {/* Header */}
      <div className="px-4 py-2 border-b border-[#E5E7EB] bg-neutral-50">
        <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
          Cases
        </h3>
      </div>

      {/* Cases List - Compact Watchlist Style */}
      <div className="flex-1 overflow-y-auto pl-2">
        {loading && (
          <div className="flex items-center justify-center h-20">
            <span className="text-xs text-neutral-500">Loading...</span>
          </div>
        )}
        
        {error && (
          <div className="px-3 py-2">
            <span className="text-xs text-red-600">Error: {error}</span>
          </div>
        )}
        
        {!loading && !error && sortedCases.length === 0 && (
          <div className="px-3 py-4">
            <span className="text-xs text-neutral-500">No active cases</span>
          </div>
        )}
        
        {sortedCases.map((caseItem) => {
          const isSelected = selectedCaseId === caseItem.id;
          const isActive = caseItem.status === 'ACTIVE';

          let bgClass = 'bg-white hover:bg-neutral-50';
          let borderClass = 'border-l-2 border-l-transparent';
          
          if (isSelected) {
            bgClass = caseItem.direction === 'LONG' ? 'bg-green-50' : 'bg-red-50';
            borderClass = caseItem.direction === 'LONG' ? 'border-l-2 border-l-green-500' : 'border-l-2 border-l-red-500';
          }

          return (
            <div
              key={caseItem.id}
              onClick={() => handleCaseSelect(caseItem)}
              className={`px-2 py-1.5 border-b border-neutral-100 cursor-pointer transition-all duration-100 ${bgClass} ${borderClass}`}
              data-testid={`case-item-${caseItem.id}`}
            >
              {/* Row 1: Symbol + PnL */}
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-neutral-900">
                  {caseItem.symbol.replace('USDT', '')}
                </span>
                {caseItem.trade_count > 0 && (
                  <span className={`text-xs font-bold ${caseItem.pnl >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {caseItem.pnl >= 0 ? '+' : ''}{caseItem.pnl_pct.toFixed(1)}%
                  </span>
                )}
              </div>

              {/* Row 2: Direction · Status · TF */}
              <div className="flex items-center gap-1 mb-0.5">
                {isActive && <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />}
                <span className="text-xs text-neutral-700 font-medium">
                  {caseItem.direction}
                </span>
                <span className="text-xs text-neutral-400">·</span>
                <span className="text-xs text-neutral-600">
                  {caseItem.status === 'ACTIVE' && 'ACTIVE'}
                  {caseItem.status === 'CLOSED_WIN' && 'CLOSED +'}
                  {caseItem.status === 'CLOSED_LOSS' && 'CLOSED −'}
                  {caseItem.status === 'WATCHING' && 'WATCH'}
                </span>
                <span className="text-xs text-neutral-400">·</span>
                <span className="text-xs text-neutral-600">{caseItem.trading_tf}</span>
              </div>

              {/* Row 3: Duration · Trades */}
              <div className="text-xs text-neutral-500">
                {caseItem.duration}
                {caseItem.trade_count > 0 && (
                  <>
                    <span className="mx-1">·</span>
                    <span>{caseItem.trade_count} exec</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
