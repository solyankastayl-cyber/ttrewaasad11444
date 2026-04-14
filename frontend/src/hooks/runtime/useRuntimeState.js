import { useEffect, useState } from "react";

const backendUrl = process.env.REACT_APP_BACKEND_URL;

export function useRuntimeState() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const fetchData = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/runtime/state`);
        if (!res.ok) throw new Error(`Runtime state request failed: ${res.status}`);
        const json = await res.json();
        if (alive) {
          setData(json.ok ? json : null);
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
    const id = setInterval(fetchData, 3000); // Poll every 3 seconds

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return { data, error, loading };
}
