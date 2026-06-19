import { pool } from "../db/pool";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function generateUniqueSlug(businessName: string): Promise<string> {
  const base = slugify(businessName) || "vendor";
  let candidate = base;
  let suffix = 2;

  while (true) {
    const result = await pool.query("SELECT 1 FROM vendors WHERE slug = $1", [candidate]);
    if (result.rowCount === 0) return candidate;
    candidate = `${base}-${suffix}`;
    suffix++;
  }
}

export function getPublicMenuUrl(slug: string): string {
  const tenantMode = process.env.TENANT_MODE || "path";
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  if (tenantMode === "subdomain") {
    const url = new URL(clientUrl);
    return `${url.protocol}//${slug}.${url.host}`;
  }

  return `${clientUrl}/menu/${slug}`;
}
