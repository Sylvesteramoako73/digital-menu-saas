import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { VendorOrder, OrderStatus } from "../../types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

const NEXT_STATUS: Partial<Record<OrderStatus, { label: string; status: OrderStatus }>> = {
  paid: { label: "Start Preparing", status: "preparing" },
  preparing: { label: "Mark Ready", status: "ready" },
  ready: { label: "Mark Completed", status: "completed" },
};

const CANCELLABLE: OrderStatus[] = ["paid", "preparing", "ready"];

export default function OrdersTab() {
  const [orders, setOrders] = useState<VendorOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const data = await apiFetch<VendorOrder[]>("/orders");
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function updateStatus(id: string, status: OrderStatus) {
    setUpdatingId(id);
    try {
      await apiFetch(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refetch();
    } finally {
      setUpdatingId(null);
    }
  }

  if (error) {
    return <p className="text-red-400 text-sm">{error}</p>;
  }
  if (!orders) {
    return <p className="text-neutral-400 text-sm">Loading orders...</p>;
  }
  if (orders.length === 0) {
    return <p className="text-neutral-500 text-sm">No orders yet.</p>;
  }

  return (
    <div className="max-w-2xl space-y-3">
      {orders.map((order) => {
        const next = NEXT_STATUS[order.status];
        const canCancel = CANCELLABLE.includes(order.status);
        return (
          <div key={order.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{order.customer_name}</p>
                <p className="text-xs text-neutral-500">{order.customer_phone}</p>
              </div>
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full shrink-0 ${
                  order.status === "cancelled" || order.status === "pending_payment"
                    ? "bg-neutral-800 text-neutral-500"
                    : "bg-white/10 text-white border border-white/20"
                }`}
              >
                {STATUS_LABELS[order.status]}
              </span>
            </div>

            <p className="text-sm text-neutral-400 mt-2 capitalize">
              {order.fulfillment_type}
              {order.fulfillment_type === "delivery" && order.delivery_address
                ? ` · ${order.delivery_address}`
                : ""}
            </p>

            <div className="mt-3 space-y-1">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-white/80">
                    {item.quantity} × {item.name}
                  </span>
                  <span className="text-white">₵{(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-800">
              <span className="text-white font-bold">₵{Number(order.subtotal).toFixed(2)}</span>
              <div className="flex gap-2">
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => updateStatus(order.id, "cancelled")}
                    disabled={updatingId === order.id}
                    className="h-9 px-3 rounded-lg text-sm font-medium text-red-400 border border-red-900 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
                {next && (
                  <button
                    type="button"
                    onClick={() => updateStatus(order.id, next.status)}
                    disabled={updatingId === order.id}
                    className="h-9 px-3 rounded-lg text-sm font-medium bg-red-600 text-white disabled:opacity-50"
                  >
                    {next.label}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
