import { usePositions } from "@/hooks/positions/usePositions";
import { useTerminal } from "../../../store/terminalStore";
import PositionCard from "../positions/PositionCard";

export default function PositionsWorkspace() {
  const { positions, refresh, isConnected } = usePositions();
  const { dispatch } = useTerminal();

  const handleClose = async (symbol) => {
    const API_URL = process.env.REACT_APP_BACKEND_URL;
    const result = await fetch(`${API_URL}/api/positions/${symbol}/close`, { method: "POST" }).then(r => r.json());
    if (result.ok) refresh();
    else console.error("Close failed:", result.error);
  };

  const handleReduce = async (symbol, pct) => {
    const API_URL = process.env.REACT_APP_BACKEND_URL;
    const result = await fetch(`${API_URL}/api/positions/${symbol}/reduce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reduce_pct: pct }),
    }).then(r => r.json());
    if (result.ok) refresh();
    else console.error("Reduce failed:", result.error);
  };

  const handleReverse = async (symbol) => {
    const API_URL = process.env.REACT_APP_BACKEND_URL;
    const result = await fetch(`${API_URL}/api/positions/${symbol}/reverse`, { method: "POST" }).then(r => r.json());
    if (result.ok) refresh();
    else console.error("Reverse failed:", result.error);
  };

  const totalPnl = positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);
  const totalNotional = positions.reduce((sum, p) => sum + ((p.entry_price || 0) * (p.qty || 0)), 0);

  return (
    <div className="p-6" data-testid="positions-workspace">
      {/* Header — same style as Analytics header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Open Positions</h2>
            <p className="text-sm text-gray-500 mt-1">
              {positions.length} active position{positions.length !== 1 ? 's' : ''} · 
              {isConnected ? ' Connected' : ' Disconnected'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Total Notional</div>
              <div className="text-lg font-bold text-gray-900">${totalNotional.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Unrealized PnL</div>
              <div className={`text-lg font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Positions Grid */}
      {positions.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 text-sm">No open positions</p>
          <p className="text-gray-400 text-xs mt-1">Approve a decision to open a position</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {positions.map((pos) => (
            <PositionCard
              key={pos.symbol}
              position={pos}
              onClose={() => handleClose(pos.symbol)}
              onReduce={(pct) => handleReduce(pos.symbol, pct)}
              onReverse={() => handleReverse(pos.symbol)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
