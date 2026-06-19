import { MenuItem } from "../../types";

interface MenuItemCardProps {
  item: MenuItem;
  onClick: () => void;
}

export default function MenuItemCard({ item, onClick }: MenuItemCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={`flex flex-row gap-3 mx-4 mb-3 p-3 rounded-2xl bg-black active:scale-[0.98] transition cursor-pointer ${
        item.is_available ? "" : "opacity-50"
      }`}
    >
      <div className="relative w-24 shrink-0">
        <div className="aspect-square w-24 rounded-xl overflow-hidden bg-neutral-800">
          {item.image_url && (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          )}
        </div>
        {!item.is_available && (
          <span className="absolute bottom-1 left-1 right-1 text-center rounded-full bg-neutral-950/90 text-white text-[10px] font-semibold py-0.5">
            Unavailable
          </span>
        )}
      </div>

      <div className="flex flex-col justify-between min-w-0 flex-1">
        <div>
          <h3 className="font-semibold text-base text-white truncate">{item.name}</h3>
          {item.description && (
            <p className="text-sm text-neutral-400 line-clamp-2 mt-0.5">{item.description}</p>
          )}
        </div>
        <p className="text-white font-bold text-base mt-1">₵{Number(item.price).toFixed(2)}</p>
      </div>
    </div>
  );
}
