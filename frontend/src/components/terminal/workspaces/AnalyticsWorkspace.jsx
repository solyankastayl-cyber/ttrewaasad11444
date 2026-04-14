/**
 * Analytics Workspace
 * Phase 4 + Phase 5: Operational Analytics Layer
 * 
 * Operator-grade analytics: 2-second scan, summary-first.
 * 
 * Layout:
 * [ Dynamic Risk (R1) ] [ Execution ] [ Safety ] [ Adaptive Risk (R2) ]
 * 
 * P0: Summary panels only
 */

import DynamicRiskAnalyticsPanel from '../analytics/DynamicRiskAnalyticsPanel';
import ExecutionAnalyticsPanel from '../analytics/ExecutionAnalyticsPanel';
import SafetyAnalyticsPanel from '../analytics/SafetyAnalyticsPanel';
import AdaptiveRiskAnalyticsPanel from '../analytics/AdaptiveRiskAnalyticsPanel';
import DecisionAnalyticsPanel from '../analytics/DecisionAnalyticsPanel';
import useAdaptiveRiskAnalytics from '@/hooks/analytics/useAdaptiveRiskAnalytics';
import { useDecisionAnalytics } from '../../../hooks/analytics/useDecisionAnalytics';

export default function AnalyticsWorkspace() {
  const { data: r2Data, loading: r2Loading } = useAdaptiveRiskAnalytics();
  const { data: decisionData, loading: decisionLoading } = useDecisionAnalytics();

  return (
    <div className="p-6 space-y-4" data-testid="analytics-workspace">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Operational Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">
          System observability: decisions, R1, R2, execution, safety
        </p>
      </div>

      {/* Sprint 5: Decision Performance — FIRST (most important) */}
      <DecisionAnalyticsPanel data={decisionData} loading={decisionLoading} />

      {/* Existing Analytics Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <DynamicRiskAnalyticsPanel />
        <AdaptiveRiskAnalyticsPanel data={r2Data} loading={r2Loading} />
        <ExecutionAnalyticsPanel />
        <SafetyAnalyticsPanel />
      </div>
    </div>
  );
}
