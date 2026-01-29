import { useState, useEffect } from "react";

export interface LogisticsLocation {
  code: string;
  name: string;
  city?: string;
  type: "port" | "airport";
  country: string; // ISO Alpha-3
}

// Global cache to avoid re-fetching on every mount
let cachedLocations: LogisticsLocation[] | null = null;
let fetchPromise: Promise<LogisticsLocation[]> | null = null;

export function useLogisticsData() {
  const [data, setData] = useState<LogisticsLocation[]>(cachedLocations || []);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedLocations);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (cachedLocations) {
      setIsLoading(false);
      return;
    }

    if (!fetchPromise) {
      // Use BASE_URL to correctly resolve the path when deployed in a subdirectory
      const baseUrl = import.meta.env.BASE_URL.endsWith("/")
        ? import.meta.env.BASE_URL
        : `${import.meta.env.BASE_URL}/`;

      fetchPromise = fetch(`${baseUrl}data/locations.json`)
        .then(async (res) => {
          if (!res.ok)
            throw new Error(`Failed to load locations: ${res.statusText}`);
          return res.json();
        })
        .then((json) => {
          cachedLocations = json;
          return json;
        });
    }

    fetchPromise
      .then((json) => {
        setData(json);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading logistics data:", err);
        setError(err);
        setIsLoading(false);
        // Reset promise on error so we can retry later if component remounts?
        // Or keep it failed. For now, we leave it.
      });
  }, []);

  return { data, isLoading, error };
}
