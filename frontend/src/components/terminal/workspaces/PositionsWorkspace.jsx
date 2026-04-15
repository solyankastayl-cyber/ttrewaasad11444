import { usePositions } from "@/hooks/positions/usePositions";
import { usePositionControl } from "@/hooks/positions/usePositionControl";
import { useProtection } from "@/hooks/positions/useProtection";
import PositionCard from "../positions/PositionCard";
import { AlertTriangle } from "lucide-react";

export default function PositionsWorkspace() {
  const { positions, refresh, isConnected } = usePositions();
  const control = usePositionControl();
  const protection = useProtection();

  const handleReduce = async (symbol, percent) => {
    const result = await control.reduce(symbol, percent);
    if (result.ok) {
      setTimeout(refresh, 1000);
    } else {
      console.error("Reduce failed:", result.error);
    }
  };

  const handleReverse = async (symbol) => {
    if (!confirm(`Reverse position for ${symbol}?`)) return;
    
    const result = await control.reverse(symbol);
    if (result.ok) {
      setTimeout(refresh, 1000);
    } else {
      console.error("Reverse failed:", result.error);
    }
  };

  const handleTP = async (symbol, price) => {
    const result = await protection.setTP(symbol, price);
    if (result.ok) {
      console.log(`TP set for ${symbol} at ${price}`);
    } else {
      console.error("Set TP failed:", result.error);
    }
  };

  const handleSL = async (symbol, price) => {
    const result = await protection.setSL(symbol, price);
    if (result.ok) {
      console.log(`SL set for ${symbol} at ${price}`);
    } else {
      console.error("Set SL failed:", result.error);
    }
  };

  const handleFlattenAll = async () => {
    if (!confirm("FLATTEN ALL POSITIONS? This will close everything immediately.")) return;
    
    const result = await control.flattenAll();
    if (result.ok) {
      setTimeout(refresh, 1000);
    } else {
      console.error("Flatten all failed:", result.error);
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="positions-workspace">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Position Control</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-gray-400">
              {positions.length} open position{positions.length !== 1 ? "s" : ""}
            </p>
            <div
              className={
                isConnected
                  ? "text-green-400 text-xs font-semibold"
                  : "text-yellow-400 text-xs font-semibold"
              }
            >
              {isConnected ? "🟢 LIVE" : "🟡 POLLING"}
            </div>
          </div>
        </div>

        {/* Flatten All Button */}
        <button
          onClick={handleFlattenAll}
          disabled={positions.length === 0}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          data-testid="flatten-all-btn"
        >
          <AlertTriangle size={18} />
          FLATTEN ALL
        </button>
      </div>

      {/* Positions Grid */}
      {positions.length === 0 ? (
        <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-12 text-center">
          <div className="text-gray-500 text-lg">No open positions</div>
          <div className="text-gray-600 text-sm mt-2">
            Positions will appear here once you open a trade
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {positions.map((pos) => (
            <PositionCard
              key={pos.symbol}
              pos={pos}
              onReduce={handleReduce}
              onReverse={handleReverse}
              onSetTP={handleTP}
              onSetSL={handleSL}
            />
          ))}
        </div>
      )}
    </div>
  );
}
