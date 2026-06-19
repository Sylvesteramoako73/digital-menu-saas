import { Router, Request, Response } from "express";
import { pool } from "../db/pool";
import { requireAuth } from "../middleware/requireAuth";
import { initializeTransaction, verifyTransaction, verifyWebhookSignature } from "../utils/paystack";

const router = Router();

interface CreateOrderItem {
  menu_item_id: string;
  quantity: number;
}

router.post("/", async (req, res) => {
  const { vendor_slug, customer_name, customer_phone, fulfillment_type, delivery_address, items } = req.body;

  if (!vendor_slug || !customer_name || !customer_phone || !fulfillment_type) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "vendor_slug, customer_name, customer_phone and fulfillment_type are required",
    });
  }
  if (!["pickup", "delivery"].includes(fulfillment_type)) {
    return res.status(400).json({ success: false, data: null, error: "fulfillment_type must be 'pickup' or 'delivery'" });
  }
  if (fulfillment_type === "delivery" && !delivery_address) {
    return res.status(400).json({ success: false, data: null, error: "delivery_address is required for delivery orders" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, data: null, error: "items must be a non-empty array" });
  }
  for (const item of items as CreateOrderItem[]) {
    if (!item.menu_item_id || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "each item requires menu_item_id and a positive integer quantity",
      });
    }
  }

  const client = await pool.connect();
  try {
    const vendorResult = await client.query("SELECT id FROM vendors WHERE slug = $1", [vendor_slug]);
    if (vendorResult.rowCount === 0) {
      return res.status(404).json({ success: false, data: null, error: "Vendor not found" });
    }
    const vendorId = vendorResult.rows[0].id;

    const itemIds = (items as CreateOrderItem[]).map((i) => i.menu_item_id);
    const menuItemsResult = await client.query(
      `SELECT mi.id, mi.name, mi.price FROM menu_items mi
       JOIN categories c ON c.id = mi.category_id
       WHERE c.vendor_id = $1 AND mi.id = ANY($2::uuid[]) AND mi.is_available = true`,
      [vendorId, itemIds]
    );

    const menuItemsById = new Map(menuItemsResult.rows.map((row) => [row.id, row]));
    const missingIds = itemIds.filter((id) => !menuItemsById.has(id));
    if (missingIds.length > 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: `These items are unavailable or no longer exist: ${missingIds.join(", ")}`,
      });
    }

    let subtotal = 0;
    const orderItemsToInsert = (items as CreateOrderItem[]).map((item) => {
      const menuItem = menuItemsById.get(item.menu_item_id)!;
      subtotal += Number(menuItem.price) * item.quantity;
      return { menu_item_id: item.menu_item_id, name: menuItem.name, price: menuItem.price, quantity: item.quantity };
    });

    await client.query("BEGIN");

    const orderResult = await client.query(
      `INSERT INTO orders (vendor_id, customer_name, customer_phone, fulfillment_type, delivery_address, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        vendorId,
        customer_name,
        customer_phone,
        fulfillment_type,
        fulfillment_type === "delivery" ? delivery_address : null,
        subtotal,
      ]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of orderItemsToInsert) {
      await client.query(
        `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity) VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.menu_item_id, item.name, item.price, item.quantity]
      );
    }

    const callbackUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/order/${orderId}/confirmation`;
    const { authorizationUrl, reference } = await initializeTransaction({
      amountPesewas: Math.round(subtotal * 100),
      email: `order-${orderId}@guest.invalid`,
      reference: orderId,
      callbackUrl,
      metadata: { order_id: orderId },
    });

    await client.query("UPDATE orders SET payment_reference = $1 WHERE id = $2", [reference, orderId]);
    await client.query("COMMIT");

    return res.status(201).json({ success: true, data: { order_id: orderId, authorization_url: authorizationUrl } });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(502).json({ success: false, data: null, error: "Failed to start payment. Please try again." });
  } finally {
    client.release();
  }
});

router.get("/:id", async (req, res) => {
  try {
    const orderResult = await pool.query("SELECT * FROM orders WHERE id = $1", [req.params.id]);
    if (orderResult.rowCount === 0) {
      return res.status(404).json({ success: false, data: null, error: "Order not found" });
    }
    let order = orderResult.rows[0];

    if (order.status === "pending_payment" && order.payment_reference) {
      try {
        const verification = await verifyTransaction(order.payment_reference);
        const expectedAmount = Math.round(Number(order.subtotal) * 100);
        if (verification.success && verification.amountPesewas === expectedAmount) {
          const updateResult = await pool.query(
            `UPDATE orders SET status = 'paid', paid_at = NOW()
             WHERE id = $1 AND status = 'pending_payment' RETURNING *`,
            [order.id]
          );
          if (updateResult.rowCount && updateResult.rowCount > 0) {
            order = updateResult.rows[0];
          }
        }
      } catch (err) {
        console.error("Paystack verify failed:", err);
      }
    }

    const vendorResult = await pool.query(
      "SELECT business_name, logo_url, slug FROM vendors WHERE id = $1",
      [order.vendor_id]
    );
    const itemsResult = await pool.query(
      "SELECT name, price, quantity FROM order_items WHERE order_id = $1",
      [order.id]
    );

    return res.json({
      success: true,
      data: {
        id: order.id,
        status: order.status,
        subtotal: order.subtotal,
        fulfillment_type: order.fulfillment_type,
        delivery_address: order.delivery_address,
        paid_at: order.paid_at,
        vendor: vendorResult.rows[0] ?? null,
        items: itemsResult.rows,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, data: null, error: "Failed to load order" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const ordersResult = await pool.query(
      "SELECT * FROM orders WHERE vendor_id = $1 ORDER BY created_at DESC",
      [req.vendor!.vendor_id]
    );
    const orderIds = ordersResult.rows.map((o) => o.id);

    const itemsResult = orderIds.length
      ? await pool.query("SELECT * FROM order_items WHERE order_id = ANY($1::uuid[])", [orderIds])
      : { rows: [] as { order_id: string }[] };

    const orders = ordersResult.rows.map((order) => ({
      ...order,
      items: itemsResult.rows.filter((item) => item.order_id === order.id),
    }));

    return res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, data: null, error: "Failed to load orders" });
  }
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  const { status } = req.body;
  const allowedTargets = ["preparing", "ready", "completed", "cancelled"];
  if (!allowedTargets.includes(status)) {
    return res.status(400).json({ success: false, data: null, error: "Invalid status" });
  }

  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1
       WHERE id = $2 AND vendor_id = $3 AND status IN ('paid', 'preparing', 'ready')
       RETURNING *`,
      [status, req.params.id, req.vendor!.vendor_id]
    );

    if (result.rowCount === 0) {
      const existing = await pool.query(
        "SELECT id FROM orders WHERE id = $1 AND vendor_id = $2",
        [req.params.id, req.vendor!.vendor_id]
      );
      if (existing.rowCount === 0) {
        return res.status(404).json({ success: false, data: null, error: "Order not found" });
      }
      return res.status(409).json({ success: false, data: null, error: "Order cannot be updated from its current status" });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, data: null, error: "Failed to update order status" });
  }
});

export async function paystackWebhookHandler(req: Request, res: Response) {
  const signature = req.headers["x-paystack-signature"] as string | undefined;
  const rawBody = req.body as Buffer;

  if (!verifyWebhookSignature(rawBody, signature)) {
    return res.status(401).json({ success: false, data: null, error: "Invalid signature" });
  }

  let event: { event?: string; data?: { reference?: string; amount?: number } };
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ success: false, data: null, error: "Invalid payload" });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    try {
      const orderResult = await pool.query(
        "SELECT subtotal FROM orders WHERE payment_reference = $1",
        [event.data.reference]
      );
      if (orderResult.rowCount && orderResult.rowCount > 0) {
        const expectedAmount = Math.round(Number(orderResult.rows[0].subtotal) * 100);
        if (event.data.amount === expectedAmount) {
          await pool.query(
            `UPDATE orders SET status = 'paid', paid_at = NOW()
             WHERE payment_reference = $1 AND status = 'pending_payment'`,
            [event.data.reference]
          );
        } else {
          console.error(
            `Paystack webhook amount mismatch for reference ${event.data.reference}: expected ${expectedAmount}, got ${event.data.amount}`
          );
        }
      }
    } catch (err) {
      console.error("Failed to process Paystack webhook:", err);
    }
  }

  return res.status(200).json({ success: true, data: null });
}

export default router;
