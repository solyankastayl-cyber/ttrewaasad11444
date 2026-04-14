/**
 * Trading Risk Tab — R1/R2 Dynamic Risk Management
 */

import React from 'react';
import DynamicRiskWorkspace from '../../../../components/terminal/workspaces/DynamicRiskWorkspace';
import { Card, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Shield } from 'lucide-react';

export default function TradingRiskTab({ terminalState }) {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base font-medium text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Динамическое Управление Рисками (R1/R2)
          </CardTitle>
        </CardHeader>
      </Card>
      
      <DynamicRiskWorkspace />
    </div>
  );
}
