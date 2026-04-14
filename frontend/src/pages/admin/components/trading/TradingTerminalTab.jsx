/**
 * Trading Terminal Tab — Main Trading Interface
 */

import React, { useState } from 'react';
import TradingChart from '../../../../components/charts/TradingChart';
import PortfolioOverview from '../../../../components/terminal/PortfolioOverview';
import AllocatorPanel from '../../../../components/terminal/AllocatorPanel';
import EquityCurve from '../../../../components/terminal/EquityCurve';
import ExecutionPanel from '../../../../components/terminal/ExecutionPanel';
import StrategyPanel from '../../../../components/terminal/StrategyPanel';
import PerformancePanel from '../../../../components/terminal/PerformancePanel';
import PnLPanel from '../../../../components/terminal/PnLPanel';

export default function TradingTerminalTab({ terminalState, tradingState, loading, onRefresh }) {
  const [symbol] = useState('BTCUSDT');
  const [timeframe] = useState('4H');
  const [lang] = useState('ru');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Загрузка терминала...</p>
        </div>
      </div>
    );
  }

  const positions = tradingState?.positions || [];
  const decision = terminalState?.decision || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* LEFT: График 2/3 ширины */}
        <div className="lg:col-span-2 space-y-4">
          <TradingChart 
            symbol={symbol} 
            timeframe={timeframe}
            height={700}
            execution={terminalState?.execution}
            decision={decision}
            structure={terminalState?.structure}
            showVolume={true}
            positions={positions.filter(p => p.symbol === symbol)}
          />
          <EquityCurve lang={lang} />
        </div>

        {/* RIGHT: Панели 1/3 ширины */}
        <div className="space-y-4">
          <PortfolioOverview lang={lang} />
          <PerformancePanel lang={lang} />
          <PnLPanel lang={lang} />
          <AllocatorPanel lang={lang} />
          <ExecutionPanel lang={lang} />
          <StrategyPanel lang={lang} />
        </div>
      </div>
    </div>
  );
}
