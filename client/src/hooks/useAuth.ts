import { useCallback, useState } from "react";
import { apiFetch } from "../lib/api";
import { clearAuth, getStoredVendor, isAuthenticated, setAuth } from "../lib/auth";
import { AuthResponse, Vendor } from "../types";

export interface RegisterPayload {
  business_name: string;
  email: string;
  password: string;
  location?: string;
  hours?: string;
  prep_time?: string;
}

export function useAuth() {
  const [vendor, setVendor] = useState<Vendor | null>(() => getStoredVendor());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuth(data.token, data.vendor);
      setVendor(data.vendor);
      return data.vendor;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to log in";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAuth(data.token, data.vendor);
      setVendor(data.vendor);
      return data.vendor;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to register";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setVendor(null);
  }, []);

  return { vendor, loading, error, login, register, logout, isAuthenticated: isAuthenticated() };
}
