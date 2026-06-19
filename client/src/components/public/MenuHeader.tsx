import { Clock, MapPin, Timer } from "lucide-react";
import { Vendor } from "../../types";

export default function MenuHeader({ vendor }: { vendor: Vendor }) {
  const chips = [
    vendor.hours ? { icon: Clock, label: vendor.hours } : null,
    vendor.location ? { icon: MapPin, label: vendor.location } : null,
    vendor.prep_time ? { icon: Timer, label: vendor.prep_time } : null,
  ].filter(Boolean) as { icon: typeof Clock; label: string }[];

  return (
    <div className="bg-black px-4 pt-6 pb-4">
      <div className="flex items-center gap-3">
        {vendor.logo_url ? (
          <img
            src={vendor.logo_url}
            alt={vendor.business_name}
            className="w-16 h-16 rounded-full object-cover border-2 border-red-600 shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-xl font-bold text-white shrink-0">
            {vendor.business_name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-xl font-bold text-white leading-tight">{vendor.business_name}</h1>
      </div>

      {chips.length > 0 && (
        <div className="flex gap-2 mt-4 overflow-x-auto scroll-touch -mx-4 px-4">
          {chips.map(({ icon: Icon, label }, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/10 px-3 py-2 text-sm text-neutral-200 shrink-0"
            >
              <Icon size={14} className="text-red-500" />
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
