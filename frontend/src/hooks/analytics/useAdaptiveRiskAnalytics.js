import { useEffect, useState } from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export default function useAdaptiveRiskAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/analytics/adaptive-risk/summary`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch R2 analytics: ${response.status}`);
      }

      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error("[useAdaptiveRiskAnalytics] fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refresh: fetchData };
}
