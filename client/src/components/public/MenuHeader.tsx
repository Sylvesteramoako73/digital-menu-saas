import { Clock, MapPin, Timer } from "lucide-react";
import { Vendor } from "../../types";

export default function MenuHeader({ vendor }: { vendor: Vendor }) {
  const chips = [
    vendor.hours ? { icon: Clock, label: vendor.hours } : null,
    vendor.location ? { icon: MapPin, label: vendor.location } : null,
    vendor.prep_time ? { icon: Timer, label: vendor.prep_time } : null,
  ].filter(Boolean) as { icon: typeof Clock; label: string }[];

  return (
    <div className="bg-white px-4 pt-6 pb-4">
      <div className="flex items-center gap-3">
        {vendor.logo_url ? (
          <img
            src={vendor.logo_url}
            alt={vendor.business_name}
            className="w-16 h-16 rounded-full object-cover border-2 border-red-700 shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-red-700 flex items-center justify-center text-xl font-bold text-white shrink-0">
            {vendor.business_name.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 className="text-xl font-bold text-red-900 leading-tight">{vendor.business_name}</h1>
      </div>

      {chips.length > 0 && (
        <div className="flex mt-4 rounded-xl border border-neutral-200 divide-x divide-neutral-200 overflow-hidden">
          {chips.map(({ icon: Icon, label }, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1 text-center min-w-0">
              <Icon size={15} className="text-red-700" />
              <span className="text-xs text-neutral-600 leading-tight truncate w-full">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
