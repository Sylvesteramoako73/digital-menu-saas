import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useVendor } from "../hooks/useVendor";
import { clearAuth } from "../lib/auth";
import ProfileTab from "../components/dashboard/ProfileTab";
import MenuBuilderTab from "../components/dashboard/MenuBuilderTab";
import ShareTab from "../components/dashboard/ShareTab";
import OrdersTab from "../components/dashboard/OrdersTab";

type Tab = "profile" | "menu" | "orders" | "share";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { vendor, loading, updateVendor } = useVendor();
  const [tab, setTab] = useState<Tab>("profile");

  function handleLogout() {
    clearAuth();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 bg-red-700">
        <h1 className="text-lg font-bold text-white">{vendor?.business_name ?? "Dashboard"}</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="h-10 px-3 flex items-center gap-1.5 text-sm text-white/90 rounded-lg active:scale-[0.98]"
        >
          <LogOut size={16} />
          Log out
        </button>
      </header>

      <nav className="flex gap-2 px-4 sm:px-8 py-3 overflow-x-auto scroll-touch bg-red-700 border-b border-red-800">
        {(["profile", "menu", "orders", "share"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`h-10 px-4 rounded-full text-sm font-medium whitespace-nowrap ${
              tab === t ? "bg-white text-red-700" : "bg-red-800/40 text-white/80 border border-white/20"
            }`}
          >
            {t === "profile" ? "Profile" : t === "menu" ? "Menu Builder" : t === "orders" ? "Orders" : "Share"}
          </button>
        ))}
      </nav>

      <main className="px-4 sm:px-8 py-6">
        {loading || !vendor ? (
          <p className="text-neutral-400 text-sm">Loading...</p>
        ) : (
          <>
            {tab === "profile" && <ProfileTab vendor={vendor} onSave={updateVendor} />}
            {tab === "menu" && <MenuBuilderTab slug={vendor.slug} />}
            {tab === "orders" && <OrdersTab />}
            {tab === "share" && <ShareTab vendor={vendor} />}
          </>
        )}
      </main>
    </div>
  );
}
