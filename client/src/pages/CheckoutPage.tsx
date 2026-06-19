import { useState, FormEvent, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCart } from "../hooks/useCart";
import { getSlugFromSubdomain } from "../lib/auth";
import { apiFetch } from "../lib/api";
import { CreateOrderResponse } from "../types";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { slug: slugParam } = useParams<{ slug: string }>();
  const slug = slugParam || getSlugFromSubdomain();
  const { items, subtotal, count } = useCart(slug);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleBack() {
    navigate(slugParam ? `/menu/${slugParam}/cart` : "/cart");
  }

  useEffect(() => {
    if (count === 0) handleBack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!slug) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = await apiFetch<CreateOrderResponse>("/orders", {
        method: "POST",
        body: JSON.stringify({
          vendor_slug: slug,
          customer_name: customerName,
          customer_phone: customerPhone,
          fulfillment_type: fulfillmentType,
          delivery_address: fulfillmentType === "delivery" ? deliveryAddress : undefined,
          items: items.map((i) => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })),
        }),
      });
      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white pb-8">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-neutral-200">
        <button
          type="button"
          onClick={handleBack}
          className="h-12 w-12 flex items-center justify-center rounded-full bg-neutral-100 text-red-900 shrink-0"
          aria-label="Back to cart"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-red-900">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-5">
        <div>
          <label className="block text-sm text-neutral-600 mb-1.5" htmlFor="customer_name">
            Your name
          </label>
          <input
            id="customer_name"
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full h-12 px-4 text-base rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-red-600"
            placeholder="Ama Asante"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-600 mb-1.5" htmlFor="customer_phone">
            Phone number
          </label>
          <input
            id="customer_phone"
            type="tel"
            required
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full h-12 px-4 text-base rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-red-600"
            placeholder="024 123 4567"
          />
        </div>

        <div>
          <span className="block text-sm text-neutral-600 mb-1.5">Fulfillment</span>
          <div className="flex gap-2">
            {(["pickup", "delivery"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFulfillmentType(type)}
                className={`flex-1 h-12 rounded-xl text-base font-medium capitalize ${
                  fulfillmentType === type
                    ? "bg-red-600 text-white"
                    : "bg-white text-neutral-600 border border-neutral-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {fulfillmentType === "delivery" && (
          <div>
            <label className="block text-sm text-neutral-600 mb-1.5" htmlFor="delivery_address">
              Delivery address
            </label>
            <input
              id="delivery_address"
              type="text"
              required
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="w-full h-12 px-4 text-base rounded-xl bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-red-600"
              placeholder="House number, street, landmark"
            />
          </div>
        )}

        <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 space-y-2">
          {items.map((item) => (
            <div key={item.menu_item_id} className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 truncate pr-3">
                {item.quantity} × {item.name}
              </span>
              <span className="text-neutral-900 shrink-0">₵{(Number(item.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
            <span className="text-red-900 font-semibold">Subtotal</span>
            <span className="text-red-900 font-bold">₵{subtotal.toFixed(2)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-xl bg-red-600 text-white font-semibold text-base active:scale-[0.98] transition disabled:opacity-60"
        >
          {submitting ? "Placing order..." : `Place Order · ₵${subtotal.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
