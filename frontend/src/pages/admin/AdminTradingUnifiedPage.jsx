/**
 * Trading Unified Admin Page
 * ===========================
 * 
 * Единая админ-страница для ВСЕЙ торговой логики с внутренними табами:
 *   - Terminal   → Execution control, portfolio, positions
 *   - Analysis   → Technical analysis, signals, market structure
 *   - Decisions  → Decision outcomes, learning, adaptation
 *   - Risk       → R1/R2 dynamic risk management
 *   - Portfolio  → Balances, exposure, PnL tracking
 *   - Execution  → Execution quality, latency, fills
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  TrendingUp, BarChart3, Target, Shield, Wallet, Radio, Loader2,
} from 'lucide-react';

// Import Trading Terminal content (we'll embed the existing page)
import AdminTradingTerminalPage from './AdminTradingTerminalPage';

// Placeholder tabs (we can expand these later)
const TechAnalysisTab = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold mb-4">Технический Анализ</h2>
    <p className="text-gray-600">Модуль теханализа будет добавлен здесь</p>
  </div>
);

const DecisionsTab = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold mb-4">Решения</h2>
    <p className="text-gray-600">Decision Outcomes & Learning будет добавлен здесь</p>
  </div>
);

const RiskTab = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold mb-4">Риски</h2>
    <p className="text-gray-600">R1/R2 Dynamic Risk будет добавлен здесь</p>
  </div>
);

const PortfolioTab = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold mb-4">Портфель</h2>
    <p className="text-gray-600">Portfolio Management будет добавлен здесь</p>
  </div>
);

const ExecutionTab = () => (
  <div className="p-6">
    <h2 className="text-xl font-semibold mb-4">Исполнение</h2>
    <p className="text-gray-600">Execution Quality будет добавлен здесь</p>
  </div>
);

export default function AdminTradingUnifiedPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('terminal');

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6" data-testid="trading-unified-admin">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Trading & Analysis</h1>
          </div>
          <p className="text-sm text-gray-500">
            Управление торговлей, теханализом, рисками и портфелем
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="terminal" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Terminal</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="decisions" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>Decisions</span>
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Risk</span>
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <span>Portfolio</span>
            </TabsTrigger>
            <TabsTrigger value="execution" className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              <span>Execution</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="terminal" className="mt-0">
            {/* Embed the existing Trading Terminal - but remove AdminLayout wrapper */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <AdminTradingTerminalPage />
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="mt-0">
            <div className="bg-white rounded-lg border border-gray-200">
              <TechAnalysisTab />
            </div>
          </TabsContent>

          <TabsContent value="decisions" className="mt-0">
            <div className="bg-white rounded-lg border border-gray-200">
              <DecisionsTab />
            </div>
          </TabsContent>

          <TabsContent value="risk" className="mt-0">
            <div className="bg-white rounded-lg border border-gray-200">
              <RiskTab />
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="mt-0">
            <div className="bg-white rounded-lg border border-gray-200">
              <PortfolioTab />
            </div>
          </TabsContent>

          <TabsContent value="execution" className="mt-0">
            <div className="bg-white rounded-lg border border-gray-200">
              <ExecutionTab />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
