import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMenu } from "../hooks/useMenu";
import { useCart } from "../hooks/useCart";
import { getSlugFromSubdomain } from "../lib/auth";
import MenuHeader from "../components/public/MenuHeader";
import CategoryTabs from "../components/public/CategoryTabs";
import MenuItemCard from "../components/public/MenuItemCard";
import CartBar from "../components/public/CartBar";
import { MenuItemSkeletonList } from "../components/public/MenuItemSkeleton";

export default function PublicMenuPage({ slug: slugProp }: { slug?: string }) {
  const navigate = useNavigate();
  const { slug: slugParam } = useParams<{ slug: string }>();
  const slug = slugProp || slugParam || getSlugFromSubdomain();
  const { menu, loading, error } = useMenu(slug);
  const { count } = useCart(slug);
  const [activeId, setActiveId] = useState("all");

  function openItem(itemId: string) {
    navigate(slugParam ? `/menu/${slugParam}/item/${itemId}` : `/item/${itemId}`);
  }

  const { heading, description, items } = useMemo(() => {
    if (!menu) return { heading: "", description: "", items: [] };
    if (activeId === "all") {
      return {
        heading: "All Items",
        description: "Everything on the menu",
        items: menu.categories.flatMap((c) => c.items),
      };
    }
    const category = menu.categories.find((c) => c.id === activeId);
    return {
      heading: category?.name ?? "",
      description: category?.description ?? "",
      items: category?.items ?? [],
    };
  }, [menu, activeId]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <p className="text-neutral-400 text-center">Menu not found.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-red-700 pb-safe-offset ${count > 0 ? "pb-24" : ""}`}>
      {loading || !menu ? (
        <div className="animate-pulse">
          <div className="bg-black px-4 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-neutral-800" />
              <div className="h-5 w-40 rounded bg-neutral-800" />
            </div>
          </div>
          <div className="pt-4">
            <MenuItemSkeletonList />
          </div>
        </div>
      ) : (
        <>
          <MenuHeader vendor={menu.vendor} />
          <CategoryTabs categories={menu.categories} activeId={activeId} onChange={setActiveId} />

          <div className="px-4 pt-4">
            <h2 className="text-lg font-semibold text-white">{heading}</h2>
            {description && <p className="text-sm text-white/70 mt-0.5">{description}</p>}
          </div>

          <div className="mt-2">
            {items.length === 0 ? (
              <p className="text-sm text-white/70 px-4 py-8 text-center">No items in this category yet.</p>
            ) : (
              items.map((item) => (
                <MenuItemCard key={item.id} item={item} onClick={() => openItem(item.id)} />
              ))
            )}
          </div>
        </>
      )}

      <CartBar slug={slug} />
    </div>
  );
}
