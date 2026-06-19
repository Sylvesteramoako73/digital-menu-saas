import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../../hooks/useCart";

export default function CartBar({ slug }: { slug: string | null | undefined }) {
  const navigate = useNavigate();
  const { count, subtotal } = useCart(slug);

  if (count === 0) return null;

  function handleClick() {
    navigate(slug ? `/menu/${slug}/cart` : "/cart");
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pt-3 pb-safe-offset bg-white border-t border-neutral-200">
      <button
        type="button"
        onClick={handleClick}
        className="w-full h-14 rounded-xl bg-red-600 text-white font-semibold text-base flex items-center justify-between px-4 active:scale-[0.98] transition"
      >
        <span className="flex items-center gap-2">
          <ShoppingBag size={20} />
          {count} item{count === 1 ? "" : "s"}
        </span>
        <span>View Cart · ₵{subtotal.toFixed(2)}</span>
      </button>
    </div>
  );
}
