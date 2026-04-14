/**
 * Trading Overview Tab — System Status
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import {
  Activity, TrendingUp, DollarSign, Target, AlertTriangle, CheckCircle,
  XCircle, Shield, Zap
} from 'lucide-react';

function StatusBadge({ status }) {
  const config = {
    healthy: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    active: { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  };
  
  const { icon: Icon, color, bg } = config[status] || config.error;
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${bg}`}>
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span className={`text-xs font-medium capitalize ${color}`}>{status}</span>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-50">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TradingOverviewTab({ terminalState, systemState, tradingState, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  const portfolio = tradingState || {};
  const positions = portfolio.positions || [];
  const totalPnL = positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);
  const activePositions = positions.filter(p => p.status === 'open').length;

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading System Status */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                Торговая Система
              </CardTitle>
              <StatusBadge status={systemState ? 'healthy' : 'warning'} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                title="Режим" 
                value={portfolio.mode || 'PAPER'} 
                icon={Activity}
              />
              <StatCard 
                title="Позиции" 
                value={activePositions} 
                subtitle={`из ${positions.length} всего`}
                icon={Target}
              />
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Performance */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Портфель
              </CardTitle>
              <StatusBadge status={totalPnL >= 0 ? 'healthy' : 'warning'} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                title="Баланс" 
                value={`$${(portfolio.balance || 0).toFixed(2)}`} 
                icon={DollarSign}
              />
              <StatCard 
                title="PnL" 
                value={`$${totalPnL.toFixed(2)}`}
                subtitle={totalPnL >= 0 ? '↑' : '↓'}
                icon={TrendingUp}
              />
            </div>
          </CardContent>
        </Card>

        {/* Risk Management */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                Управление Рисками
              </CardTitle>
              <StatusBadge status="active" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                title="R1 Active" 
                value={terminalState?.risk?.r1_enabled ? 'YES' : 'NO'} 
                icon={Shield}
              />
              <StatCard 
                title="R2 Active" 
                value={terminalState?.risk?.r2_enabled ? 'YES' : 'NO'} 
                icon={Shield}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Positions Table */}
      {activePositions > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-medium text-slate-900">
              Активные Позиции
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 text-slate-600 font-medium">Символ</th>
                    <th className="text-left py-2 px-3 text-slate-600 font-medium">Направление</th>
                    <th className="text-right py-2 px-3 text-slate-600 font-medium">Размер</th>
                    <th className="text-right py-2 px-3 text-slate-600 font-medium">Цена входа</th>
                    <th className="text-right py-2 px-3 text-slate-600 font-medium">PnL</th>
                    <th className="text-center py-2 px-3 text-slate-600 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.filter(p => p.status === 'open').map((position, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-900">{position.symbol}</td>
                      <td className="py-2 px-3">
                        <Badge variant={position.side === 'LONG' ? 'default' : 'secondary'}>
                          {position.side}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-900">{position.size}</td>
                      <td className="py-2 px-3 text-right text-slate-900">
                        ${position.entry_price?.toFixed(2)}
                      </td>
                      <td className={`py-2 px-3 text-right font-medium ${
                        (position.unrealized_pnl || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        ${(position.unrealized_pnl || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant="outline" className="text-xs">
                          {position.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activePositions === 0 && (
        <Card className="border-slate-200">
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-slate-100">
                <Target className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">Нет активных позиций</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
