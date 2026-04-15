/**
 * Analytics Workspace
 * Sprint 5 + Sprint 6: Decision Analytics + Learning Layer
 * 
 * Operator-grade analytics: explainable, actionable insights.
 * 
 * Layout:
 * [ Learning Insights (Sprint 6) ] - Self-awareness layer
 * [ Decision Performance (Sprint 5) ] - Outcomes & performance
 * [ R1 | R2 | Execution | Safety ] - Operational metrics
 */

import DynamicRiskAnalyticsPanel from '../analytics/DynamicRiskAnalyticsPanel';
import ExecutionAnalyticsPanel from '../analytics/ExecutionAnalyticsPanel';
import SafetyAnalyticsPanel from '../analytics/SafetyAnalyticsPanel';
import AdaptiveRiskAnalyticsPanel from '../analytics/AdaptiveRiskAnalyticsPanel';
import DecisionAnalyticsPanel from '../analytics/DecisionAnalyticsPanel';
import LearningInsightsPanel from '../analytics/LearningInsightsPanel';
import useAdaptiveRiskAnalytics from '@/hooks/analytics/useAdaptiveRiskAnalytics';
import { useDecisionAnalytics } from '../../../hooks/analytics/useDecisionAnalytics';

export default function AnalyticsWorkspace() {
  const { data: r2Data, loading: r2Loading } = useAdaptiveRiskAnalytics();
  const { data: decisionData, loading: decisionLoading } = useDecisionAnalytics();

  return (
    <div className="p-6 space-y-4" data-testid="analytics-workspace">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Operational Analytics</h2>
        <p className="text-sm text-gray-500 mt-1">
          System observability: learning, decisions, R1, R2, execution, safety
        </p>
      </div>

      {/* Sprint 6: Learning Insights — FIRST (self-awareness) */}
      <LearningInsightsPanel />

      {/* Sprint 5: Decision Performance — SECOND (outcomes) */}
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
