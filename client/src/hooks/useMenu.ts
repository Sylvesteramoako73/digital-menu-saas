import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { PublicMenu } from "../types";

export function useMenu(slug: string | null | undefined) {
  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<PublicMenu>(`/menu/${slug}`);
      setMenu(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { menu, loading, error, refetch };
}
