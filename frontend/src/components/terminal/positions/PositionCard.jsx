import { useState } from "react";

export default function PositionCard({ pos, onReduce, onReverse, onSetTP, onSetSL }) {
  const [tpValue, setTpValue] = useState("");
  const [slValue, setSlValue] = useState("");

  const sideColor = pos.side === "LONG" ? "text-green-400" : "text-red-400";
  const pnlColor = pos.unrealized_pnl >= 0 ? "text-green-400" : "text-red-400";

  const handleTPSubmit = () => {
    if (tpValue && !isNaN(tpValue)) {
      onSetTP(pos.symbol, Number(tpValue));
      setTpValue("");
    }
  };

  const handleSLSubmit = () => {
    if (slValue && !isNaN(slValue)) {
      onSetSL(pos.symbol, Number(slValue));
      setSlValue("");
    }
  };

  return (
    <div 
      className="bg-gray-900/60 border border-gray-800 rounded-lg p-4 space-y-3 hover:border-gray-700 transition-colors"
      data-testid={`position-card-${pos.symbol}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="text-lg font-semibold text-white" data-testid="position-symbol">
            {pos.symbol}
          </div>
          <div className={`text-sm ${sideColor} font-medium`} data-testid="position-side">
            {pos.side} · {pos.qty}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-400">Unrealized PnL</div>
          <div className={`text-lg font-semibold ${pnlColor}`} data-testid="position-pnl">
            ${pos.unrealized_pnl?.toFixed(2) || "0.00"}
          </div>
          <div className="text-xs text-gray-500">
            {pos.unrealized_pnl_pct ? `${(pos.unrealized_pnl_pct * 100).toFixed(2)}%` : "0.00%"}
          </div>
        </div>
      </div>

      {/* Position Info */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-gray-500">Entry</div>
          <div className="text-white font-medium">${pos.entry_price?.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-500">Mark</div>
          <div className="text-white font-medium">${pos.mark_price?.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-500">Leverage</div>
          <div className="text-white font-medium">{pos.leverage}x</div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onReduce(pos.symbol, 25)}
          className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-2 rounded text-sm font-medium transition-colors"
          data-testid="reduce-25-btn"
        >
          -25%
        </button>
        <button
          onClick={() => onReduce(pos.symbol, 50)}
          className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-3 py-2 rounded text-sm font-medium transition-colors"
          data-testid="reduce-50-btn"
        >
          -50%
        </button>
        <button
          onClick={() => onReduce(pos.symbol, 100)}
          className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-2 rounded text-sm font-medium transition-colors"
          data-testid="close-position-btn"
        >
          Close
        </button>
        <button
          onClick={() => onReverse(pos.symbol)}
          className="flex-1 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 px-3 py-2 rounded text-sm font-medium transition-colors"
          data-testid="reverse-position-btn"
        >
          Reverse
        </button>
      </div>

      {/* Protection Controls */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400 font-medium">Protection</div>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="number"
              placeholder="Take Profit"
              value={tpValue}
              onChange={(e) => setTpValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTPSubmit();
              }}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              data-testid="tp-input"
            />
          </div>
          <button
            onClick={handleTPSubmit}
            className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-2 rounded text-sm font-medium transition-colors"
            data-testid="tp-submit-btn"
          >
            Set TP
          </button>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="number"
              placeholder="Stop Loss"
              value={slValue}
              onChange={(e) => setSlValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSLSubmit();
              }}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              data-testid="sl-input"
            />
          </div>
          <button
            onClick={handleSLSubmit}
            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded text-sm font-medium transition-colors"
            data-testid="sl-submit-btn"
          >
            Set SL
          </button>
        </div>
      </div>
    </div>
  );
}
