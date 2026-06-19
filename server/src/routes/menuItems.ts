import { Router } from "express";
import { pool } from "../db/pool";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  const { category_id, name, description, price, original_price, image_url } = req.body;
  if (!category_id || !name || price === undefined) {
    return res.status(400).json({ success: false, data: null, error: "category_id, name and price are required" });
  }
  if (original_price !== undefined && original_price !== null && Number(original_price) <= Number(price)) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "original_price must be greater than price",
    });
  }

  try {
    const ownsCategory = await pool.query(
      "SELECT 1 FROM categories WHERE id = $1 AND vendor_id = $2",
      [category_id, req.vendor!.vendor_id]
    );
    if (ownsCategory.rowCount === 0) {
      return res.status(404).json({ success: false, data: null, error: "Category not found" });
    }

    const result = await pool.query(
      `INSERT INTO menu_items (category_id, name, description, price, original_price, image_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [category_id, name, description ?? null, price, original_price ?? null, image_url ?? null]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, data: null, error: "Failed to create menu item" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM menu_items mi
       USING categories c
       WHERE mi.id = $1 AND mi.category_id = c.id AND c.vendor_id = $2
       RETURNING mi.id`,
      [req.params.id, req.vendor!.vendor_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, data: null, error: "Menu item not found" });
    }
    return res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, data: null, error: "Failed to delete menu item" });
  }
});

router.patch("/:id/toggle", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE menu_items mi SET is_available = NOT mi.is_available
       FROM categories c
       WHERE mi.id = $1 AND mi.category_id = c.id AND c.vendor_id = $2
       RETURNING mi.*`,
      [req.params.id, req.vendor!.vendor_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, data: null, error: "Menu item not found" });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, data: null, error: "Failed to toggle menu item" });
  }
});

export default router;
