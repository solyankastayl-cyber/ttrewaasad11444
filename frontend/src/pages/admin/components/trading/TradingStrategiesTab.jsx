/**
 * Trading Strategies Tab
 */

import React from 'react';
import StrategyPanel from '../../../../components/terminal/StrategyPanel';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Target } from 'lucide-react';

export default function TradingStrategiesTab() {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            Управление Стратегиями
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StrategyPanel lang="ru" />
        </CardContent>
      </Card>
    </div>
  );
}
