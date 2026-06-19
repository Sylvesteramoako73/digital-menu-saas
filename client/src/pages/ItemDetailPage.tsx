import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMenu } from "../hooks/useMenu";
import { useCart } from "../hooks/useCart";
import { getSlugFromSubdomain } from "../lib/auth";
import QuantityStepper from "../components/public/QuantityStepper";

export default function ItemDetailPage() {
  const navigate = useNavigate();
  const { slug: slugParam, itemId } = useParams<{ slug: string; itemId: string }>();
  const slug = slugParam || getSlugFromSubdomain();
  const { menu, loading, error } = useMenu(slug);
  const { addItem } = useCart(slug);
  const [quantity, setQuantity] = useState(1);

  const item = menu?.categories.flatMap((c) => c.items).find((i) => i.id === itemId);

  function handleBack() {
    navigate(slugParam ? `/menu/${slugParam}` : "/");
  }

  function handleAddToCart() {
    if (!item) return;
    addItem(item, quantity);
    handleBack();
  }

  if (loading || !menu) {
    return (
      <div className="min-h-screen bg-black animate-pulse">
        <div className="aspect-[4/3] w-full bg-neutral-800" />
        <div className="px-4 pt-4 space-y-3">
          <div className="h-6 w-2/3 rounded bg-neutral-800" />
          <div className="h-4 w-full rounded bg-neutral-800" />
          <div className="h-4 w-1/3 rounded bg-neutral-800" />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 gap-4">
        <p className="text-neutral-400 text-center">Item not found.</p>
        <button
          type="button"
          onClick={handleBack}
          className="h-12 px-6 rounded-xl bg-red-600 text-white font-semibold text-base active:scale-[0.98] transition"
        >
          Back to menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-safe-offset">
      <div className="relative">
        <div className="aspect-[4/3] w-full bg-neutral-800 overflow-hidden">
          {item.image_url && (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          )}
        </div>
        {!item.is_available && (
          <span className="absolute bottom-3 left-4 rounded-full bg-black/90 text-white text-xs font-semibold px-3 py-1">
            Unavailable
          </span>
        )}
        <button
          type="button"
          onClick={handleBack}
          className="absolute top-3 left-3 h-12 w-12 flex items-center justify-center rounded-full bg-black/80 text-white"
          aria-label="Back to menu"
        >
          <ArrowLeft size={22} />
        </button>
      </div>

      <div className="px-4 pt-4 pb-28">
        <h1 className="text-xl font-bold text-white">{item.name}</h1>
        {item.description && (
          <p className="text-base text-neutral-300 mt-2 leading-relaxed">{item.description}</p>
        )}
        <p className="text-2xl font-bold text-white mt-4">₵{Number(item.price).toFixed(2)}</p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-safe-offset bg-black border-t border-neutral-900 flex items-center gap-3">
        <QuantityStepper quantity={quantity} onChange={setQuantity} min={1} />
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!item.is_available}
          className="flex-1 h-12 rounded-xl bg-red-600 text-white font-semibold text-base active:scale-[0.98] transition disabled:opacity-50"
        >
          {item.is_available
            ? `Add to Cart · ₵${(Number(item.price) * quantity).toFixed(2)}`
            : "Unavailable"}
        </button>
      </div>
    </div>
  );
}
