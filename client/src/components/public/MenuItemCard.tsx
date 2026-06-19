import { MenuItem } from "../../types";

interface MenuItemCardProps {
  item: MenuItem;
  onClick: () => void;
}

export default function MenuItemCard({ item, onClick }: MenuItemCardProps) {
  const hasDiscount = item.original_price !== null && Number(item.original_price) > Number(item.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(item.price) / Number(item.original_price)) * 100)
    : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={`flex flex-row gap-3 mx-4 mb-3 p-3 rounded-2xl bg-white shadow-sm border border-neutral-100 active:scale-[0.98] transition cursor-pointer ${
        item.is_available ? "" : "opacity-50"
      }`}
    >
      <div className="relative w-24 shrink-0">
        <div className="aspect-square w-24 rounded-xl overflow-hidden bg-neutral-100">
          {item.image_url && (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          )}
        </div>
        {hasDiscount && (
          <span className="absolute top-1 left-1 rounded bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5">
            -{discountPercent}%
          </span>
        )}
        {!item.is_available && (
          <span className="absolute bottom-1 left-1 right-1 text-center rounded-full bg-black/80 text-white text-[10px] font-semibold py-0.5">
            Unavailable
          </span>
        )}
      </div>

      <div className="flex flex-col justify-between min-w-0 flex-1">
        <div>
          <h3 className="font-semibold text-base text-red-900 truncate">{item.name}</h3>
          {item.description && (
            <p className="text-sm text-neutral-500 line-clamp-2 mt-0.5">{item.description}</p>
          )}
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-orange-700 font-bold text-base">₵{Number(item.price).toFixed(2)}</p>
          {hasDiscount && (
            <p className="text-neutral-400 text-sm line-through">₵{Number(item.original_price).toFixed(2)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
