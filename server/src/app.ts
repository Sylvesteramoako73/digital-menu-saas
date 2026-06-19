import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import vendorsRoutes from "./routes/vendors";
import categoriesRoutes from "./routes/categories";
import menuItemsRoutes from "./routes/menuItems";
import menuRoutes from "./routes/menu";
import ordersRoutes, { paystackWebhookHandler } from "./routes/orders";

const app = express();
const TENANT_MODE = process.env.TENANT_MODE || "path";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const corsOrigin =
  TENANT_MODE === "subdomain"
    ? new RegExp(`^https?://([a-z0-9-]+\\.)?${new URL(CLIENT_URL).host.replace(/\./g, "\\.")}$`)
    : CLIENT_URL;

app.use(cors({ origin: corsOrigin }));

// Must be registered before express.json() — Paystack's webhook signature is
// verified over the raw request body, which the JSON parser would otherwise consume.
app.post("/api/orders/webhook/paystack", express.raw({ type: "application/json" }), paystackWebhookHandler);

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", tenantMode: TENANT_MODE } });
});

app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/menu-items", menuItemsRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", ordersRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, data: null, error: "Not found" });
});

export default app;
