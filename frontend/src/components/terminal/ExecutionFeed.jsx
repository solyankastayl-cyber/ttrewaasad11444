import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const ExecutionFeed = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/trading/events?limit=20`);
      const data = await res.json();
      
      if (data.ok && data.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Events fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 2000);
    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'SIGNAL_DETECTED': return <TrendingUp className="w-3.5 h-3.5 text-blue-500" />;
      case 'DECISION_MADE': return <ArrowRight className="w-3.5 h-3.5 text-purple-500" />;
      case 'ORDER_SUBMITTED': return <Activity className="w-3.5 h-3.5 text-orange-500" />;
      case 'ORDER_FILLED': return <Activity className="w-3.5 h-3.5 text-green-500" />;
      case 'POSITION_OPENED': return <TrendingDown className="w-3.5 h-3.5 text-[#04A584]" />;
      default: return <Activity className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  const getEventColor = (eventType) => {
    switch (eventType) {
      case 'SIGNAL_DETECTED': return 'text-blue-700';
      case 'DECISION_MADE': return 'text-purple-700';
      case 'ORDER_SUBMITTED': return 'text-orange-700';
      case 'ORDER_FILLED': return 'text-green-700';
      case 'POSITION_OPENED': return 'text-[#04A584]';
      default: return 'text-gray-700';
    }
  };

  const formatEventType = (type) => {
    return type.replace(/_/g, ' ');
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    return `${Math.floor(diffSecs / 3600)}h ago`;
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-[#e6eaf2]" style={{ boxShadow: '2px 2px 8px rgba(0,5,48,0.06)' }}>
      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Execution Feed</h3>
      
      <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-4 text-sm text-gray-400">Loading...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-400">No events yet</div>
        ) : (
          events.map((event, idx) => (
            <div key={idx} className="flex items-start gap-2 pb-1.5 border-b border-gray-50 last:border-0">
              <div className="mt-0.5">
                {getEventIcon(event.event_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-medium ${getEventColor(event.event_type)}`}>
                    {formatEventType(event.event_type)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-medium text-gray-900">
                    {event.symbol?.replace('USDT', '') || event.symbol}
                  </span>
                  {event.data?.side && (
                    <span className={`text-xs px-1 py-0.5 rounded ${
                      event.data.side === 'LONG' || event.data.side === 'BUY' 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {event.data.side}
                    </span>
                  )}
                  {event.data?.confidence && (
                    <span className="text-xs text-gray-500">
                      {(event.data.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExecutionFeed;
