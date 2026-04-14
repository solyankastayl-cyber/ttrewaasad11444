import { useEffect, useState } from "react";

export function usePositions() {
  const [positions, setPositions] = useState([]);

  const fetchPositions = async () => {
    try {
      const res = await fetch("/api/positions");
      const data = await res.json();
      setPositions(data || []);
    } catch (err) {
      console.error("[usePositions] Error:", err);
      setPositions([]);
    }
  };

  useEffect(() => {
    fetchPositions();
    const interval = setInterval(fetchPositions, 2000);
    return () => clearInterval(interval);
  }, []);

  return { positions, refresh: fetchPositions };
}
