import { Router } from "express";
import { pool } from "../db/pool";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  const { name, description, order_index } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, data: null, error: "name is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO categories (vendor_id, name, description, order_index)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.vendor!.vendor_id, name, description ?? null, order_index ?? 0]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, data: null, error: "Failed to create category" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM categories WHERE id = $1 AND vendor_id = $2 RETURNING id`,
      [req.params.id, req.vendor!.vendor_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, data: null, error: "Category not found" });
    }
    return res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, data: null, error: "Failed to delete category" });
  }
});

export default router;
