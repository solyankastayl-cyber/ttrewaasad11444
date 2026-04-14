import { useMemo, useEffect } from "react";
import SmartChartPanel from "../panels/SmartChartPanel";
import TradeExplainabilityStrip from "../panels/TradeExplainabilityStrip";
import CaseRailCompact from "../trade-case/CaseRailCompact";
import CaseCommandHeaderUltraCompact from "../trade-case/CaseCommandHeaderUltraCompact";
import CaseIntelligenceMinimal from "../trade-case/CaseIntelligenceMinimal";
import CaseTimelineMinimal from "../trade-case/CaseTimelineMinimal";
import ChartHeaderOverlay from "../trade-case/ChartHeaderOverlay";
import ChartMiniStatus from "../trade-case/ChartMiniStatus";
import { useTerminal } from "../../../store/terminalStore";
import { useTradingCases } from "../../../hooks/useTradingCases";

export default function TradeWorkspace() {
  const { state, dispatch } = useTerminal();
  const { cases: realCases } = useTradingCases();

  // Auto-select first active case on mount
  useEffect(() => {
    if (!state.selectedCase && realCases.length > 0) {
      dispatch({
        type: 'SET_SELECTED_CASE',
        payload: realCases[0]
      });
    }
  }, [state.selectedCase, dispatch, realCases]);

  const selectedCase = state.selectedCase;

  // Check if case has active position
  const hasPosition = selectedCase?.status === 'ACTIVE';

  return (
    <div className="flex flex-col h-full bg-white" style={{ fontFamily: 'Gilroy, sans-serif' }}>
      {/* TOP: Status Strip */}
      <div className="px-4 py-1.5 border-b border-neutral-200 flex-shrink-0 bg-white">
        <TradeExplainabilityStrip />
      </div>

      {/* MAIN CONTENT: Rail + Chart + Intelligence */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT: Case Rail (220px, compact watchlist) */}
        <div className="w-[220px] flex-shrink-0 border-r border-neutral-200">
          <CaseRailCompact />
        </div>

        {/* CENTER + RIGHT: Chart + Intelligence */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* CASE HEADER: Ultra Compact (2 rows) - WITH PADDING FOR RAIL */}
          <div className="border-b border-neutral-200">
            <CaseCommandHeaderUltraCompact caseData={selectedCase} />
          </div>

          {/* Chart + Intelligence Row */}
          <div className="flex flex-1 min-h-0">
            {/* CENTER: Chart (dominant, with inline header) */}
            <div className="flex-1 relative bg-white">
              {/* Chart Header Overlay (inside chart) */}
              <ChartHeaderOverlay caseData={selectedCase} hasPosition={hasPosition} />
              
              {/* Chart Canvas - Clean, no extra wrappers */}
              <SmartChartPanel hideNoTradeOverlay={true} />
              
              {/* Mini Status Overlay (top-right) */}
              <ChartMiniStatus caseData={selectedCase} />
            </div>

            {/* RIGHT: Intelligence (300px, minimal) */}
            <div className="w-[300px] flex-shrink-0 border-l border-neutral-200 overflow-y-auto">
              <CaseIntelligenceMinimal caseData={selectedCase} />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM: Timeline (thin strip, 40px) */}
      <CaseTimelineMinimal caseData={selectedCase} />
    </div>
  );
}
