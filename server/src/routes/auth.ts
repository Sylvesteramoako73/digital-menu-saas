import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db/pool";
import { signToken } from "../utils/jwt";
import { generateUniqueSlug } from "../utils/slug";

const router = Router();

router.post("/register", async (req, res) => {
  const { business_name, email, password, location, hours, prep_time, logo_url } = req.body;

  if (!business_name || !email || !password) {
    return res.status(400).json({ success: false, data: null, error: "business_name, email and password are required" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ success: false, data: null, error: "Password must be at least 6 characters" });
  }

  const client = await pool.connect();
  try {
    const existing = await client.query("SELECT 1 FROM vendor_auth WHERE email = $1", [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(409).json({ success: false, data: null, error: "Email already registered" });
    }

    const slug = await generateUniqueSlug(business_name);

    await client.query("BEGIN");

    const vendorResult = await client.query(
      `INSERT INTO vendors (business_name, slug, logo_url, location, hours, prep_time)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [business_name, slug, logo_url || null, location || null, hours || null, prep_time || null]
    );
    const vendor = vendorResult.rows[0];

    const passwordHash = await bcrypt.hash(password, 10);
    await client.query(
      `INSERT INTO vendor_auth (vendor_id, email, password_hash) VALUES ($1, $2, $3)`,
      [vendor.id, email, passwordHash]
    );

    await client.query("COMMIT");

    const token = signToken({ vendor_id: vendor.id, slug: vendor.slug });
    return res.status(201).json({ success: true, data: { token, vendor } });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ success: false, data: null, error: "Failed to register vendor" });
  } finally {
    client.release();
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, data: null, error: "email and password are required" });
  }

  try {
    const result = await pool.query(
      `SELECT va.password_hash, v.* FROM vendor_auth va
       JOIN vendors v ON v.id = va.vendor_id
       WHERE va.email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, data: null, error: "Invalid email or password" });
    }

    const row = result.rows[0];
    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, data: null, error: "Invalid email or password" });
    }

    const { password_hash, ...vendor } = row;
    const token = signToken({ vendor_id: vendor.id, slug: vendor.slug });
    return res.json({ success: true, data: { token, vendor } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, data: null, error: "Failed to log in" });
  }
});

export default router;
