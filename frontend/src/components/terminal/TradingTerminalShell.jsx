import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { TerminalProvider, useTerminal } from "../../store/terminalStore";
import TerminalModuleHeader from "./TerminalModuleHeader";
import TradeWorkspace from "./workspaces/TradeWorkspace";
import PortfolioWorkspace from "./workspaces/PortfolioWorkspace";
import StrategiesWorkspace from "./workspaces/StrategiesWorkspace";
import ExecutionWorkspace from "./workspaces/ExecutionWorkspace";
import SystemWorkspace from "./workspaces/SystemWorkspace";
import ZAPWorkspace from "./workspaces/ZAPWorkspace";
import ConfigWorkspace from "./workspaces/ConfigWorkspace";
import PositionsWorkspace from "./workspaces/PositionsWorkspace";
import ExecutionFeedWorkspace from "./workspaces/ExecutionFeedWorkspace";
import DynamicRiskWorkspace from "./workspaces/DynamicRiskWorkspace";
import AnalyticsWorkspace from "./workspaces/AnalyticsWorkspace";
import DecisionsWorkspace from "./workspaces/DecisionsWorkspace";

function WorkspaceRouter() {
  const { state } = useTerminal();

  switch (state.selectedWorkspace) {
    case "trade":
      return <TradeWorkspace />;
    case "portfolio":
      return <PortfolioWorkspace />;
    case "positions":
      return <PositionsWorkspace />;
    case "strategies":
      return <StrategiesWorkspace />;
    case "execution":
      return <ExecutionWorkspace />;
    case "execution-feed":
      return <ExecutionFeedWorkspace />;
    case "risk":
      return <DynamicRiskWorkspace />;
    case "system":
      return <SystemWorkspace />;
    case "analytics":
      return <AnalyticsWorkspace />;
    case "zap":
      return <ZAPWorkspace />;
    case "config":
      return <ConfigWorkspace />;
    case "decisions":
      return <DecisionsWorkspace />;
    default:
      return <TradeWorkspace />;
  }
}

function TradingTerminalContent() {
  const { dispatch } = useTerminal();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["trade", "portfolio", "positions", "strategies", "execution", "execution-feed", "risk", "analytics", "system", "zap", "config", "decisions"].includes(tab)) {
      dispatch({ type: "SET_WORKSPACE", payload: tab });
    }
  }, [searchParams, dispatch]);

  return (
    <div className="w-full h-full flex flex-col bg-[#f5f7fa] text-black" style={{ fontFamily: 'Gilroy, sans-serif' }}>
      <TerminalModuleHeader />
      <div className="flex-1 overflow-y-auto p-0">
        <WorkspaceRouter />
      </div>
    </div>
  );
}

export default function TradingTerminalShell() {
  return (
    <TerminalProvider>
      <TradingTerminalContent />
    </TerminalProvider>
  );
}
