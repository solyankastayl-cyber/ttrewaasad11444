import { useEffect } from "react";
import SmartChartPanel from "../panels/SmartChartPanel";
import TradeExplainabilityStrip from "../panels/TradeExplainabilityStrip";
import CaseRailCompact from "../trade-case/CaseRailCompact";
import CaseCommandHeaderUltraCompact from "../trade-case/CaseCommandHeaderUltraCompact";
import ExecutionFeed from "../ExecutionFeed";
import { useTerminal } from "../../../store/terminalStore";
import { useTradingCases } from "../../../hooks/useTradingCases";

export default function TradeWorkspace() {
  const { state, dispatch } = useTerminal();
  const { cases: realCases } = useTradingCases();

  useEffect(() => {
    if (!state.selectedCase && realCases.length > 0) {
      dispatch({ type: "SET_SELECTED_CASE", payload: realCases[0] });
    }
  }, [state.selectedCase, dispatch, realCases]);

  const selectedCase = state.selectedCase;

  return (
    <div className="flex flex-col h-full" data-testid="trade-workspace" style={{ fontFamily: 'Gilroy, sans-serif' }}>
      {/* TOP: Status Strip */}
      <div className="px-4 py-1.5 border-b border-gray-200 flex-shrink-0 bg-white">
        <TradeExplainabilityStrip />
      </div>

      {/* MAIN: Sidebar + Chart — flex row, no overlap */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT SIDEBAR: Cases list — fixed width */}
        <div className="w-[260px] flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
          <CaseRailCompact />
        </div>

        {/* RIGHT: Header + Chart + Feed — flex column */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          {/* Case Header — NOT absolute, NOT overlapping */}
          <div className="border-b border-gray-200 flex-shrink-0 bg-white">
            <CaseCommandHeaderUltraCompact caseData={selectedCase} />
          </div>

          {/* Chart — takes remaining space */}
          <div className="flex-1 min-h-0 relative">
            <SmartChartPanel hideNoTradeOverlay={true} />
          </div>

          {/* Execution Feed — fixed at bottom */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-white max-h-[130px] overflow-y-auto">
            <ExecutionFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
