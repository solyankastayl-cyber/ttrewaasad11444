/**
 * Execution Feed - Live Execution Visibility Layer
 * NO DESIGN. NO COLORS. JUST TRUTH.
 */

import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function mapEventType(type) {
  switch (type) {
    case 'ORDER_SUBMIT_REQUESTED':
      return 'SUBMITTED';
    case 'ORDER_ACKNOWLEDGED':
      return 'ACK';
    case 'ORDER_FILLED':
      return 'FILLED';
    case 'ORDER_REJECTED':
      return 'REJECTED';
    default:
      return type;
  }
}

export default function ExecutionFeed() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/api/execution/feed?limit=20`);
        const data = await res.json();
        setEvents(data.feed || []);
      } catch (err) {
        console.error('[ExecutionFeed] Error:', err);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ fontFamily: 'monospace', fontSize: '13px', padding: '16px' }}>
      <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>
        EXECUTION FEED (polling 2s)
      </div>
      {events.length === 0 && (
        <div style={{ color: '#666' }}>No events yet...</div>
      )}
      {events.slice(0, 20).map((e, i) => (
        <div key={e.event_id || i} style={{ padding: '4px 0' }}>
          [{new Date(e.timestamp).toLocaleTimeString()}]{' '}
          {e.symbol} — {mapEventType(e.type)}
          {e.fill_price && ` @ $${e.fill_price}`}
          {e.reason && ` (${e.reason})`}
        </div>
      ))}
    </div>
  );
}
