import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useCart } from "../hooks/useCart";
import { getSlugFromSubdomain } from "../lib/auth";
import QuantityStepper from "../components/public/QuantityStepper";

export default function CartPage() {
  const navigate = useNavigate();
  const { slug: slugParam } = useParams<{ slug: string }>();
  const slug = slugParam || getSlugFromSubdomain();
  const { items, updateQuantity, removeItem, subtotal, count } = useCart(slug);

  function handleBack() {
    navigate(slugParam ? `/menu/${slugParam}` : "/");
  }

  function handleCheckout() {
    navigate(slugParam ? `/menu/${slugParam}/checkout` : "/checkout");
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-neutral-200">
        <button
          type="button"
          onClick={handleBack}
          className="h-12 w-12 flex items-center justify-center rounded-full bg-neutral-100 text-red-900 shrink-0"
          aria-label="Back to menu"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-red-900">Your Cart</h1>
      </div>

      {count === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 pt-20 gap-4">
          <p className="text-neutral-500 text-center">Your cart is empty.</p>
          <button
            type="button"
            onClick={handleBack}
            className="h-12 px-6 rounded-xl bg-red-600 text-white font-semibold text-base active:scale-[0.98] transition"
          >
            Browse menu
          </button>
        </div>
      ) : (
        <>
          <div className="px-4 pt-2">
            {items.map((item) => (
              <div key={item.menu_item_id} className="flex gap-3 py-3 border-b border-neutral-200">
                <div className="aspect-square w-16 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-base text-red-900 truncate">{item.name}</p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.menu_item_id)}
                      className="h-8 w-8 flex items-center justify-center text-red-600 shrink-0"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-orange-700 text-sm mt-0.5">₵{Number(item.price).toFixed(2)} each</p>
                  <div className="mt-2">
                    <QuantityStepper
                      quantity={item.quantity}
                      onChange={(q) => updateQuantity(item.menu_item_id, q)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-safe-offset bg-white border-t border-neutral-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-neutral-500 text-sm">Subtotal</span>
              <span className="text-red-900 font-bold text-lg">₵{subtotal.toFixed(2)}</span>
            </div>
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full h-12 rounded-xl bg-red-600 text-white font-semibold text-base active:scale-[0.98] transition"
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
