/**
 * Trading Execution Tab — Execution Layer Quality
 */

import React from 'react';
import ExecutionPanel from '../../../../components/terminal/ExecutionPanel';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Radio } from 'lucide-react';

export default function TradingExecutionTab({ systemState }) {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium text-slate-900 flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-600" />
            Execution Quality & Latency Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExecutionPanel lang="ru" />
        </CardContent>
      </Card>
    </div>
  );
}
