import { useEffect, useState } from "react";

export default function TradeExplainabilityStrip() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const API_URL = process.env.REACT_APP_BACKEND_URL || '';
        const res = await fetch(`${API_URL}/api/trading/system/explainability`);
        const json = await res.json();
        setData(json.data || null);
      } catch (e) {
        console.error('[TradeExplainability] Load error:', e);
        setData(null);
      }
    }

    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, []);

  if (!data) return null;

  const getStatusColor = () => {
    if (!data.risk?.can_trade) return 'bg-red-50 text-red-700';
    if (data.allocator?.decisions_out === 0) return 'bg-orange-50 text-orange-700';
    return 'bg-green-50 text-green-700';
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] px-3 py-2 bg-neutral-50 rounded-lg border border-[#E5E7EB]" data-testid="trade-explainability-strip" style={{ fontFamily: 'Gilroy, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
      <span className={`rounded-lg px-2 py-1 font-semibold ${getStatusColor()}`}>
        {data.mode === 'bootstrap' ? '🔍 BOOTSTRAP' : '🎯 PRODUCTION'}
      </span>
      <span className="rounded-lg bg-neutral-100 px-2 py-1">
        Regime: {String(data.regime || "unknown").toUpperCase()}
      </span>
      <span className="rounded-lg bg-neutral-100 px-2 py-1">
        Signals: {data.signals?.generated ?? 0}
      </span>
      <span className="rounded-lg bg-neutral-100 px-2 py-1">
        Accepted: {data.ranking?.accepted ?? 0}
      </span>
      <span className="rounded-lg bg-blue-50 text-blue-700 px-2 py-1 font-semibold">
        Decisions: {data.allocator?.decisions_out ?? 0}
      </span>
      <span className="rounded-lg bg-neutral-100 px-2 py-1">
        Risk: {data.risk?.reason || "n/a"}
      </span>
      {data.allocator?.decisions_out === 0 && data.allocator?.signals_in > 0 && (
        <span className="rounded-lg bg-orange-50 text-orange-700 px-2 py-1 text-[10px]">
          ⚠️ {data.allocator?.reason || "No decisions"}
        </span>
      )}
    </div>
  );
}
