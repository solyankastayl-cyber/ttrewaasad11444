import { useState } from "react";

export default function PositionCard({ position, onClose, onReduce, onReverse }) {
  const [showActions, setShowActions] = useState(false);
  const p = position;
  const isLong = p.side === "LONG";
  const pnl = p.unrealized_pnl || 0;
  const pnlPct = p.unrealized_pnl_pct || 0;
  const isProfitable = pnl >= 0;
  const notional = (p.entry_price || 0) * (p.qty || 0);

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow"
      data-testid={`position-card-${p.symbol}`}
      style={{ fontFamily: 'Gilroy, sans-serif', fontVariantNumeric: 'tabular-nums' }}
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between"
        style={{ borderLeft: `3px solid ${isLong ? '#16a34a' : '#dc2626'}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">
            {p.symbol?.replace('USDT', '')}/USDT
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
            isLong ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {p.side}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            {isProfitable ? '+' : ''}{pnlPct.toFixed(2)}%
          </span>
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-xs text-gray-400 hover:text-gray-600 px-1"
            data-testid={`position-actions-toggle-${p.symbol}`}
          >
            {showActions ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-5 py-3 grid grid-cols-2 gap-x-6 gap-y-2.5">
        <div>
          <div className="text-[11px] text-gray-400 uppercase tracking-wide">Entry</div>
          <div className="text-sm font-semibold text-gray-900">${(p.entry_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div>
          <div className="text-[11px] text-gray-400 uppercase tracking-wide">Mark</div>
          <div className="text-sm font-semibold text-gray-900">${(p.mark_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div>
          <div className="text-[11px] text-gray-400 uppercase tracking-wide">Size</div>
          <div className="text-sm text-gray-700">{(p.qty || 0).toFixed(6)}</div>
        </div>
        <div>
          <div className="text-[11px] text-gray-400 uppercase tracking-wide">Notional</div>
          <div className="text-sm text-gray-700">${notional.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-[11px] text-gray-400 uppercase tracking-wide">Unrealized PnL</div>
          <div className={`text-sm font-semibold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            {isProfitable ? '+' : ''}${pnl.toFixed(4)}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-gray-400 uppercase tracking-wide">Leverage</div>
          <div className="text-sm text-gray-700">{p.leverage || 1}x</div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-5 pb-3 pt-2 border-t border-gray-100" data-testid={`position-actions-${p.symbol}`}>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onReduce(25)}
              className="text-xs px-3 py-1.5 rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors font-medium"
              data-testid={`reduce-25-${p.symbol}`}
            >
              -25%
            </button>
            <button
              onClick={() => onReduce(50)}
              className="text-xs px-3 py-1.5 rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors font-medium"
              data-testid={`reduce-50-${p.symbol}`}
            >
              -50%
            </button>
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors font-medium"
              data-testid={`close-position-${p.symbol}`}
            >
              Close
            </button>
            <button
              onClick={onReverse}
              className="text-xs px-3 py-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors font-medium"
              data-testid={`reverse-position-${p.symbol}`}
            >
              Reverse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
