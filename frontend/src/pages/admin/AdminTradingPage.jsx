/**
 * Trading Admin Dashboard — Tabbed Interface
 * ============================================
 * Полноценная админка Trading модуля.
 * 
 * Табы:
 *  - Обзор (Overview) — системный статус торговли
 *  - Терминал (Terminal) — главный торговый интерфейс  
 *  - Стратегии (Strategies) — управление стратегиями
 *  - Риски (Risk) — R1/R2 динамические риски
 *  - Аналитика (Analytics) — решения и результаты
 *  - Исполнение (Execution) — execution layer
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  Activity, Zap, Target, Shield, BarChart3, Radio,
  RefreshCw, Loader2,
} from 'lucide-react';

// Import tab components
import TradingOverviewTab from './components/trading/TradingOverviewTab';
import TradingTerminalTab from './components/trading/TradingTerminalTab';
import TradingStrategiesTab from './components/trading/TradingStrategiesTab';
import TradingRiskTab from './components/trading/TradingRiskTab';
import TradingAnalyticsTab from './components/trading/TradingAnalyticsTab';
import TradingExecutionTab from './components/trading/TradingExecutionTab';

const API = process.env.REACT_APP_BACKEND_URL;

const TABS = [
  { id: 'overview', label: 'Обзор', icon: Activity },
  { id: 'terminal', label: 'Терминал', icon: Zap },
  { id: 'strategies', label: 'Стратегии', icon: Target },
  { id: 'risk', label: 'Риски', icon: Shield },
  { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
  { id: 'execution', label: 'Исполнение', icon: Radio },
];

export default function AdminTradingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();

  const activeTab = searchParams.get('tab') || 'overview';

  const [terminalState, setTerminalState] = useState(null);
  const [systemState, setSystemState] = useState(null);
  const [tradingState, setTradingState] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const symbol = 'BTCUSDT';
      const timeframe = '4H';
      
      const [terminalRes, systemRes, tradingRes] = await Promise.allSettled([
        fetch(`${API}/api/terminal/state/${symbol}?timeframe=${timeframe}`).then(r => r.json()),
        fetch(`${API}/api/execution-reality/system/state`).then(r => r.json()),
        fetch(`${API}/api/trading/portfolio`).then(r => r.json()),
      ]);

      if (terminalRes.status === 'fulfilled' && terminalRes.value.ok) {
        setTerminalState(terminalRes.value.data);
      }
      if (systemRes.status === 'fulfilled' && systemRes.value.ok) {
        setSystemState(systemRes.value);
      }
      if (tradingRes.status === 'fulfilled' && tradingRes.value.ok) {
        setTradingState(tradingRes.value.portfolio);
      }
    } catch (e) {
      console.error('[TradingAdmin] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!authLoading && isAuthenticated) fetchAll();
  }, [authLoading, isAuthenticated, navigate, fetchAll]);

  useEffect(() => {
    const id = setInterval(fetchAll, 30_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const setTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <TradingOverviewTab 
            terminalState={terminalState}
            systemState={systemState}
            tradingState={tradingState}
            loading={loading}
          />
        );
      case 'terminal':
        return (
          <TradingTerminalTab 
            terminalState={terminalState}
            tradingState={tradingState}
            loading={loading}
            onRefresh={fetchAll}
          />
        );
      case 'strategies':
        return <TradingStrategiesTab />;
      case 'risk':
        return <TradingRiskTab terminalState={terminalState} />;
      case 'analytics':
        return <TradingAnalyticsTab />;
      case 'execution':
        return <TradingExecutionTab systemState={systemState} />;
      default:
        return (
          <TradingOverviewTab 
            terminalState={terminalState}
            systemState={systemState}
            tradingState={tradingState}
            loading={loading}
          />
        );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="trading-admin-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-indigo-600" />
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Trading Terminal</h1>
              <p className="text-xs text-gray-500">
                FOMO-Trade v1.2 · Admin Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            data-testid="trading-refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Обновить
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto" data-testid="trading-tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              data-testid={`tab-${id}`}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {renderTab()}
        </div>
      </div>
    </AdminLayout>
  );
}
