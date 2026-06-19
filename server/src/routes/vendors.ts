import { Router } from "express";
import { pool } from "../db/pool";
import { requireAuth } from "../middleware/requireAuth";
import { getPublicMenuUrl } from "../utils/slug";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM vendors WHERE id = $1", [req.vendor!.vendor_id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, data: null, error: "Vendor not found" });
    }
    const vendor = result.rows[0];
    return res.json({ success: true, data: { ...vendor, public_url: getPublicMenuUrl(vendor.slug) } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, data: null, error: "Failed to load vendor" });
  }
});

router.put("/me", requireAuth, async (req, res) => {
  const { business_name, logo_url, location, hours, prep_time } = req.body;
  try {
    const result = await pool.query(
      `UPDATE vendors SET
        business_name = COALESCE($1, business_name),
        logo_url = $2,
        location = $3,
        hours = $4,
        prep_time = $5
       WHERE id = $6 RETURNING *`,
      [business_name, logo_url ?? null, location ?? null, hours ?? null, prep_time ?? null, req.vendor!.vendor_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, data: null, error: "Vendor not found" });
    }
    const vendor = result.rows[0];
    return res.json({ success: true, data: { ...vendor, public_url: getPublicMenuUrl(vendor.slug) } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, data: null, error: "Failed to update vendor" });
  }
});

export default router;
