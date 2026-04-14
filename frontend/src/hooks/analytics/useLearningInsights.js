/**
 * Sprint 6.4: Learning Insights Hook
 * 
 * Fetches pattern extraction insights (NO ML).
 */

import { useState, useEffect } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export function useLearningInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchInsights() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/learning/insights`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          console.error('[useLearningInsights] Failed:', err);
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchInsights();

    // Refresh every 15 seconds (less frequent than analytics)
    const interval = setInterval(fetchInsights, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { data, loading, error };
}
