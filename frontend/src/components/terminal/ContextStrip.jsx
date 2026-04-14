import { useState, useEffect } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function ContextStrip() {
  const [state, setState] = useState({
    equity: null,
    exposure: null,
    riskState: null,
    systemState: null,
    loading: true
  });

  useEffect(() => {
    const fetchState = async () => {
      try {
        const [portfolioRes, runtimeRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/portfolio/state`, { signal: AbortSignal.timeout(5000) }),
          fetch(`${BACKEND_URL}/api/runtime/state`, { signal: AbortSignal.timeout(5000) })
        ]);

        const portfolio = await portfolioRes.json();
        const runtime = await runtimeRes.json();

        setState({
          equity: portfolio.equity?.total,
          exposure: portfolio.deployment_pct,
          riskState: runtime.mode === 'AUTO' ? 'R1 Active' : 'Manual',
          systemState: runtime.enabled ? 'Live' : 'Standby',
          loading: false
        });
      } catch (err) {
        console.error('[ContextStrip] fetch error:', err);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 10000);
    return () => clearInterval(interval);
  }, []);

  if (state.loading) {
    return (
      <div className="flex items-center gap-6 px-4 py-2 bg-gray-950 border-b border-gray-800">
        <span className="text-xs text-gray-500">Loading system state...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-gray-900 border-b border-gray-700 text-xs">
      {/* Equity */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500">EQUITY</span>
        <span className="text-white font-medium">
          {state.equity ? `$${state.equity.toLocaleString()}` : '—'}
        </span>
      </div>

      {/* Exposure */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500">EXPOSURE</span>
        <span className={
          state.exposure > 80 ? "text-amber-400 font-medium" :
          state.exposure > 50 ? "text-emerald-400" :
          "text-gray-400"
        }>
          {state.exposure ? `${state.exposure.toFixed(1)}%` : '—'}
        </span>
      </div>

      {/* Risk State */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500">RISK</span>
        <span className={
          state.riskState === 'R1 Active' ? "text-amber-400 font-medium" : "text-gray-400"
        }>
          {state.riskState || '—'}
        </span>
      </div>

      {/* System State */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500">SYSTEM</span>
        <span className={
          state.systemState === 'Live' ? "text-emerald-400 font-medium" : "text-gray-500"
        }>
          {state.systemState || '—'}
        </span>
      </div>
    </div>
  );
}
