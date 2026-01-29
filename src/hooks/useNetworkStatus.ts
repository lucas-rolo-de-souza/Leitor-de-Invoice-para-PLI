import { useState, useEffect, useCallback } from "react";

interface NetworkStatus {
  isOnline: boolean;
  latency: number | null; // ms
  lastChecked: Date | null;
}

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    latency: null,
    lastChecked: null,
  });

  const checkLatency = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus((prev) => ({ ...prev, isOnline: false, latency: null }));
      return;
    }

    const start = performance.now();
    try {
      // Use a lightweight HEAD request to the current origin to avoid downloading data
      // Cache-control: no-cache to ensure we hit the network
      await fetch(window.location.origin, {
        method: "HEAD",
        cache: "no-cache",
        mode: "no-cors",
      });
      const end = performance.now();
      const latency = Math.round(end - start);

      setStatus({
        isOnline: true,
        latency,
        lastChecked: new Date(),
      });
    } catch (e) {
      // Even if the request fails (e.g. server error), if we got a response it implies connectivity,
      // but fetch throws on network errors (offline).
      // So detailed check might be needed, but for now simple fallback:
      setStatus((prev) => ({
        ...prev,
        // If fetch throws, we might be offline or DNS failed
        isOnline: prev.isOnline,
        // Keep previous latency or set to null? Let's keep null to indicate issue
        latency: null,
        lastChecked: new Date(),
      }));
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      checkLatency();
    };
    const handleOffline = () =>
      setStatus((prev) => ({ ...prev, isOnline: false, latency: null }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    checkLatency();

    // Periodic check every 30 seconds to not hog connection
    const intervalId = setInterval(checkLatency, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(intervalId);
    };
  }, [checkLatency]);

  // Allow manual re-check
  return { ...status, checkLatency };
};
