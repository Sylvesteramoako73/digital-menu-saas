import { ApiResponse } from "../types";
import { getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body: ApiResponse<T> = await response.json();

  if (!response.ok || !body.success) {
    throw new Error(body.error || "Request failed");
  }

  return body.data as T;
}
