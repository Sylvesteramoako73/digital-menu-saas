import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { apiFetch } from "../lib/api";
import { useCart } from "../hooks/useCart";
import { OrderSummary } from "../types";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_MS = 30000;

export default function OrderConfirmationPage() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const clearedRef = useRef(false);
  const { clear } = useCart(order?.vendor?.slug ?? null);

  async function fetchOrder() {
    if (!orderId) return null;
    try {
      const data = await apiFetch<OrderSummary>(`/orders/${orderId}`);
      setOrder(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order");
      return null;
    }
  }

  useEffect(() => {
    let elapsed = 0;
    let cancelled = false;

    async function poll() {
      const data = await fetchOrder();
      if (cancelled) return;
      if (data && data.status !== "pending_payment") return;
      elapsed += POLL_INTERVAL_MS;
      if (elapsed >= MAX_POLL_MS) {
        setTimedOut(true);
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (order?.status && order.status !== "pending_payment" && order.status !== "cancelled" && !clearedRef.current) {
      clearedRef.current = true;
      clear();
    }
  }, [order, clear]);

  function handleBackToMenu() {
    navigate(order?.vendor?.slug ? `/menu/${order.vendor.slug}` : "/");
  }

  function handleRetryCheck() {
    setTimedOut(false);
    fetchOrder();
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 gap-4">
        <XCircle size={48} className="text-red-600" />
        <p className="text-neutral-500 text-center">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <p className="text-neutral-500">Loading order...</p>
      </div>
    );
  }

  const isConfirmed = order.status !== "pending_payment" && order.status !== "cancelled";
  const isCancelled = order.status === "cancelled";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12 text-center">
      {isConfirmed && (
        <>
          <CheckCircle2 size={56} className="text-green-600 mb-4" />
          <h1 className="text-xl font-bold text-red-900">Order placed!</h1>
          <p className="text-neutral-500 mt-2">
            {order.vendor?.business_name ?? "The vendor"} is preparing your order.
          </p>
        </>
      )}

      {!isConfirmed && !isCancelled && !timedOut && (
        <>
          <Clock size={56} className="text-orange-600 mb-4 animate-pulse" />
          <h1 className="text-xl font-bold text-red-900">Confirming payment...</h1>
          <p className="text-neutral-500 mt-2">This usually takes a few seconds.</p>
        </>
      )}

      {!isConfirmed && !isCancelled && timedOut && (
        <>
          <Clock size={56} className="text-orange-600 mb-4" />
          <h1 className="text-xl font-bold text-red-900">Still waiting on payment</h1>
          <p className="text-neutral-500 mt-2">If you completed payment, check again below.</p>
          <button
            type="button"
            onClick={handleRetryCheck}
            className="h-12 px-6 mt-4 rounded-xl bg-red-600 text-white font-semibold text-base active:scale-[0.98] transition"
          >
            Check again
          </button>
        </>
      )}

      {isCancelled && (
        <>
          <XCircle size={56} className="text-red-600 mb-4" />
          <h1 className="text-xl font-bold text-red-900">Order cancelled</h1>
        </>
      )}

      <div className="w-full max-w-sm mt-8 rounded-xl bg-neutral-50 border border-neutral-200 p-4 text-left space-y-2">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">
              {item.quantity} × {item.name}
            </span>
            <span className="text-neutral-900">₵{(Number(item.price) * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
          <span className="text-red-900 font-semibold">Total</span>
          <span className="text-red-900 font-bold">₵{Number(order.subtotal).toFixed(2)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleBackToMenu}
        className="h-12 px-6 mt-6 rounded-xl bg-white border border-neutral-200 text-red-900 font-semibold text-base active:scale-[0.98] transition"
      >
        Back to menu
      </button>
    </div>
  );
}
