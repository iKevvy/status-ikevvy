import { useCallback, useEffect, useState } from "react";

const REFRESH_INTERVAL = 30000;

export function useStatus() {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async (initial = false) => {
    try {
      if (!initial) {
        setRefreshing(true);
      }

      const response = await fetch("/api/v1/status", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Status API returned ${response.status}`
        );
      }

      const data = await response.json();

      setStatusData(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch status:", err);
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus(true);

    const interval = setInterval(() => {
      fetchStatus(false);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  return {
    statusData,
    loading,
    refreshing,
    error,
    refresh: fetchStatus,
  };
}
