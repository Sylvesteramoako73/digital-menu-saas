import { FormEvent, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useMenu } from "../../hooks/useMenu";
import { CategoryWithItems, MenuItem } from "../../types";

export default function MenuBuilderTab({ slug }: { slug: string }) {
  const { menu, loading, refetch } = useMenu(slug);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [addingCategory, setAddingCategory] = useState(false);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    setAddingCategory(true);
    try {
      await apiFetch("/categories", {
        method: "POST",
        body: JSON.stringify({ name: newCategory.name, description: newCategory.description || undefined }),
      });
      setNewCategory({ name: "", description: "" });
      await refetch();
    } finally {
      setAddingCategory(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    await apiFetch(`/categories/${id}`, { method: "DELETE" });
    await refetch();
  }

  if (loading || !menu) {
    return <p className="text-neutral-400 text-sm">Loading menu...</p>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3 items-stretch">
        <input
          type="text"
          value={newCategory.name}
          onChange={(e) => setNewCategory((c) => ({ ...c, name: e.target.value }))}
          placeholder="Category name (e.g. Mains)"
          className="flex-1 h-12 px-4 text-base rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
        />
        <input
          type="text"
          value={newCategory.description}
          onChange={(e) => setNewCategory((c) => ({ ...c, description: e.target.value }))}
          placeholder="Description (optional)"
          className="flex-1 h-12 px-4 text-base rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
        />
        <button
          type="submit"
          disabled={addingCategory}
          className="h-12 px-5 rounded-xl bg-red-600 text-white font-semibold text-base active:scale-[0.98] transition disabled:opacity-60 shrink-0"
        >
          Add category
        </button>
      </form>

      <div className="space-y-3">
        {menu.categories.map((category) => (
          <CategoryAccordion
            key={category.id}
            category={category}
            isExpanded={expanded.has(category.id)}
            onToggle={() => toggleExpanded(category.id)}
            onDelete={() => handleDeleteCategory(category.id)}
            onChanged={refetch}
          />
        ))}
        {menu.categories.length === 0 && (
          <p className="text-sm text-neutral-500">No categories yet. Add one above to get started.</p>
        )}
      </div>
    </div>
  );
}

function CategoryAccordion({
  category,
  isExpanded,
  onToggle,
  onDelete,
  onChanged,
}: {
  category: CategoryWithItems;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onChanged: () => Promise<void>;
}) {
  const [newItem, setNewItem] = useState({ name: "", description: "", price: "", originalPrice: "", image_url: "" });
  const [addingItem, setAddingItem] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  async function handleAddItem(e: FormEvent) {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.price) return;
    setAddingItem(true);
    setItemError(null);
    try {
      await apiFetch("/menu-items", {
        method: "POST",
        body: JSON.stringify({
          category_id: category.id,
          name: newItem.name,
          description: newItem.description || undefined,
          price: Number(newItem.price),
          original_price: newItem.originalPrice ? Number(newItem.originalPrice) : undefined,
          image_url: newItem.image_url || undefined,
        }),
      });
      setNewItem({ name: "", description: "", price: "", originalPrice: "", image_url: "" });
      await onChanged();
    } catch (err) {
      setItemError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setAddingItem(false);
    }
  }

  async function handleDeleteItem(id: string) {
    await apiFetch(`/menu-items/${id}`, { method: "DELETE" });
    await onChanged();
  }

  async function handleToggleItem(id: string) {
    await apiFetch(`/menu-items/${id}/toggle`, { method: "PATCH" });
    await onChanged();
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <button type="button" onClick={onToggle} className="flex items-center gap-2 text-left flex-1 min-w-0">
          {isExpanded ? <ChevronUp size={18} className="text-neutral-400 shrink-0" /> : <ChevronDown size={18} className="text-neutral-400 shrink-0" />}
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{category.name}</p>
            <p className="text-xs text-neutral-500">{category.items.length} item{category.items.length === 1 ? "" : "s"}</p>
          </div>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="h-10 w-10 flex items-center justify-center text-red-400 shrink-0"
          aria-label="Delete category"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-neutral-800 p-4 space-y-3">
          {category.items.map((item: MenuItem) => (
            <div key={item.id} className="flex items-center justify-between gap-3 py-2 border-b border-neutral-800 last:border-b-0">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.name}</p>
                <p className="text-xs text-neutral-500">
                  ₵{Number(item.price).toFixed(2)}
                  {item.original_price && (
                    <span className="line-through ml-1.5">₵{Number(item.original_price).toFixed(2)}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleItem(item.id)}
                  className={`h-8 px-3 rounded-full text-xs font-medium ${
                    item.is_available ? "bg-white/10 text-white border border-white/20" : "bg-neutral-800 text-neutral-500"
                  }`}
                >
                  {item.is_available ? "Available" : "Unavailable"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="h-8 w-8 flex items-center justify-center text-red-400"
                  aria-label="Delete item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          <form onSubmit={handleAddItem} className="grid grid-cols-2 gap-2 pt-2">
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem((i) => ({ ...i, name: e.target.value }))}
              placeholder="Item name"
              className="col-span-2 h-11 px-3 text-base rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
            />
            <input
              type="text"
              value={newItem.description}
              onChange={(e) => setNewItem((i) => ({ ...i, description: e.target.value }))}
              placeholder="Description"
              className="col-span-2 h-11 px-3 text-base rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={newItem.price}
              onChange={(e) => setNewItem((i) => ({ ...i, price: e.target.value }))}
              placeholder="Price"
              className="h-11 px-3 text-base rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={newItem.originalPrice}
              onChange={(e) => setNewItem((i) => ({ ...i, originalPrice: e.target.value }))}
              placeholder="Original price (optional)"
              className="h-11 px-3 text-base rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
            />
            <input
              type="text"
              value={newItem.image_url}
              onChange={(e) => setNewItem((i) => ({ ...i, image_url: e.target.value }))}
              placeholder="Image URL"
              className="col-span-2 h-11 px-3 text-base rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
            />
            {itemError && <p className="col-span-2 text-sm text-red-400">{itemError}</p>}
            <button
              type="submit"
              disabled={addingItem}
              className="col-span-2 h-11 rounded-lg bg-red-600 text-white font-semibold text-sm active:scale-[0.98] transition disabled:opacity-60"
            >
              Add item
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
