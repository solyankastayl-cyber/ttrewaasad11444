/**
 * Trading Analytics Tab — Decisions & Outcomes
 */

import React from 'react';
import AnalyticsWorkspace from '../../../../components/terminal/workspaces/AnalyticsWorkspace';
import { Card, CardHeader, CardTitle } from '../../../../components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function TradingAnalyticsTab() {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Аналитика Решений и Результатов
          </CardTitle>
        </CardHeader>
      </Card>
      
      <AnalyticsWorkspace />
    </div>
  );
}
