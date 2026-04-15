import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export function useDecisionQuality() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/analytics/decision-quality`);
        const json = await res.json();
        if (json.ok) setData(json);
      } catch (err) {
        console.error('[DecisionQuality] fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, []);

  return { data, loading };
}
