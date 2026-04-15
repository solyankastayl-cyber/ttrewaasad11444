import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function mapEventType(type) {
  switch (type) {
    case 'ORDER_SUBMIT_REQUESTED': return 'SUBMITTED';
    case 'ORDER_ACKNOWLEDGED': return 'ACK';
    case 'ORDER_FILLED': return 'FILLED';
    case 'ORDER_REJECTED': return 'REJECTED';
    default: return type;
  }
}

function statusColor(type) {
  const mapped = mapEventType(type);
  if (mapped === 'FILLED') return 'text-green-600';
  if (mapped === 'REJECTED') return 'text-red-600';
  if (mapped === 'ACK') return 'text-blue-600';
  return 'text-gray-500';
}

export default function ExecutionFeed() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/api/execution/feed?limit=20`);
        const data = await res.json();
        setEvents(data.feed || []);
      } catch (err) { /* silent */ }
    };
    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-4 py-2" data-testid="execution-feed">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Execution Feed
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      </div>
      {events.length === 0 ? (
        <div className="text-xs text-gray-400 font-mono">Waiting for execution events...</div>
      ) : (
        <div className="space-y-0.5 font-mono text-xs">
          {events.slice(0, 6).map((e, i) => (
            <div key={e.event_id || i} className="flex items-center gap-2 text-gray-500">
              <span className="text-gray-400 w-[60px] flex-shrink-0">
                {new Date(e.timestamp).toLocaleTimeString('en', { hour12: false })}
              </span>
              <span className="text-gray-700 w-[70px] flex-shrink-0 font-medium">{e.symbol}</span>
              <span className={`font-medium ${statusColor(e.type)}`}>
                {mapEventType(e.type)}
              </span>
              {e.fill_price && <span className="text-gray-600">@ ${e.fill_price}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
