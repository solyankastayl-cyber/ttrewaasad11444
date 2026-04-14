import { useEffect, useState } from "react";

const backendUrl = process.env.REACT_APP_BACKEND_URL;

export function usePendingDecisions() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/runtime/decisions/pending`);
      if (!res.ok) throw new Error(`Pending decisions request failed: ${res.status}`);
      const json = await res.json();
      setData(json.ok ? (json.decisions || []) : []);
      setError(null);
      setLoading(false);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;

    const fetchData = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/runtime/decisions/pending`);
        if (!res.ok) throw new Error(`Pending decisions request failed: ${res.status}`);
        const json = await res.json();
        if (alive) {
          setData(json.ok ? (json.decisions || []) : []);
          setError(null);
          setLoading(false);
        }
      } catch (e) {
        if (alive) {
          setError(e.message);
          setLoading(false);
        }
      }
    };

    fetchData();
    const id = setInterval(fetchData, 2000); // Poll every 2 seconds

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return { data, error, loading, refetch };
}
