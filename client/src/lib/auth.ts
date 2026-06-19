import { Vendor } from "../types";

const TOKEN_KEY = "dms_token";
const VENDOR_KEY = "dms_vendor";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredVendor(): Vendor | null {
  const raw = localStorage.getItem(VENDOR_KEY);
  return raw ? (JSON.parse(raw) as Vendor) : null;
}

export function setAuth(token: string, vendor: Vendor): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(VENDOR_KEY, JSON.stringify(vendor));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(VENDOR_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

const TENANT_MODE = import.meta.env.VITE_TENANT_MODE || "path";
const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || "";

export function getSlugFromSubdomain(): string | null {
  if (TENANT_MODE !== "subdomain") return null;

  const host = window.location.hostname;
  if (host === "localhost" || host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
    return null;
  }
  if (ROOT_DOMAIN && host.endsWith(`.${ROOT_DOMAIN}`)) {
    return host.slice(0, host.length - ROOT_DOMAIN.length - 1);
  }
  return host.split(".")[0];
}

export function isSubdomainMode(): boolean {
  return TENANT_MODE === "subdomain";
}
