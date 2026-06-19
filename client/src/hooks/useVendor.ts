import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { Vendor } from "../types";

export function useVendor() {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Vendor>("/vendors/me");
      setVendor(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendor");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVendor = useCallback(async (payload: Partial<Vendor>) => {
    const data = await apiFetch<Vendor>("/vendors/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    setVendor(data);
    return data;
  }, []);

  useEffect(() => {
    refetch().catch(() => {});
  }, [refetch]);

  return { vendor, loading, error, refetch, updateVendor };
}
