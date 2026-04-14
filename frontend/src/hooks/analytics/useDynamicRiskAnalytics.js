/**
 * Dynamic Risk Analytics Hook
 * Phase 4: Operational Analytics Layer
 * 
 * Simple fetch on mount. NO polling, NO WebSocket, NO global state.
 */

import { useState, useEffect } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export function useDynamicRiskAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/analytics/dynamic-risk/summary`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dynamic risk analytics: ${response.status}`);
      }
      
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error('[useDynamicRiskAnalytics] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { data, loading, error, refresh };
}
