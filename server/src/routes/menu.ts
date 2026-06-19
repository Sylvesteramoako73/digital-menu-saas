import { Router } from "express";
import { pool } from "../db/pool";

const router = Router();

router.get("/:slug", async (req, res) => {
  try {
    const vendorResult = await pool.query("SELECT * FROM vendors WHERE slug = $1", [req.params.slug]);
    if (vendorResult.rowCount === 0) {
      return res.status(404).json({ success: false, data: null, error: "Menu not found" });
    }
    const vendor = vendorResult.rows[0];

    const categoriesResult = await pool.query(
      "SELECT * FROM categories WHERE vendor_id = $1 ORDER BY order_index ASC, name ASC",
      [vendor.id]
    );

    const itemsResult = await pool.query(
      `SELECT mi.* FROM menu_items mi
       JOIN categories c ON c.id = mi.category_id
       WHERE c.vendor_id = $1
       ORDER BY mi.name ASC`,
      [vendor.id]
    );

    const categories = categoriesResult.rows.map((category) => ({
      ...category,
      items: itemsResult.rows.filter((item) => item.category_id === category.id),
    }));

    return res.json({ success: true, data: { vendor, categories } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, data: null, error: "Failed to load menu" });
  }
});

export default router;
