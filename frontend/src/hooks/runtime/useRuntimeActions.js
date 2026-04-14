import { useState } from "react";
import { toast } from "sonner";

const backendUrl = process.env.REACT_APP_BACKEND_URL;

export function useRuntimeActions() {
  const [loading, setLoading] = useState(false);

  const startRuntime = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/runtime/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Runtime started");
        return json;
      } else {
        toast.error("Failed to start runtime");
        return null;
      }
    } catch (e) {
      toast.error(`Error: ${e.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const stopRuntime = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/runtime/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Runtime stopped");
        return json;
      } else {
        toast.error("Failed to stop runtime");
        return null;
      }
    } catch (e) {
      toast.error(`Error: ${e.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const runOnce = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/runtime/run-once`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.ok) {
        const summary = json.summary || {};
        toast.success(
          `Cycle complete: ${summary.signals || 0} signals, ${summary.pending_created || 0} pending created`
        );
        return json;
      } else {
        toast.error("Run-once failed");
        return null;
      }
    } catch (e) {
      toast.error(`Error: ${e.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const setMode = async (mode) => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/runtime/mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`Mode set to ${mode}`);
        return json;
      } else {
        toast.error("Failed to set mode");
        return null;
      }
    } catch (e) {
      toast.error(`Error: ${e.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const approveDecision = async (decisionId) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${backendUrl}/api/runtime/decisions/${decisionId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      const json = await res.json();
      if (json.ok) {
        toast.success("Decision approved & executed");
        return json;
      } else {
        toast.error("Failed to approve decision");
        return null;
      }
    } catch (e) {
      toast.error(`Error: ${e.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const rejectDecision = async (decisionId, reason = null) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${backendUrl}/api/runtime/decisions/${decisionId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );
      const json = await res.json();
      if (json.ok) {
        toast.success("Decision rejected");
        return json;
      } else {
        toast.error("Failed to reject decision");
        return null;
      }
    } catch (e) {
      toast.error(`Error: ${e.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    startRuntime,
    stopRuntime,
    runOnce,
    setMode,
    approveDecision,
    rejectDecision,
  };
}
