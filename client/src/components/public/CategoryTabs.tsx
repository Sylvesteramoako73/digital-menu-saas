import { Category } from "../../types";

interface CategoryTabsProps {
  categories: Category[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function CategoryTabs({ categories, activeId, onChange }: CategoryTabsProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-neutral-200">
      <div className="flex gap-2 overflow-x-auto scroll-touch px-4 py-3">
        <Tab label="All" active={activeId === "all"} onClick={() => onChange("all")} />
        {categories.map((category) => (
          <Tab
            key={category.id}
            label={category.name}
            active={activeId === category.id}
            onClick={() => onChange(category.id)}
          />
        ))}
      </div>
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 px-4 shrink-0 whitespace-nowrap rounded-full text-sm font-medium transition active:scale-[0.98] ${
        active
          ? "bg-red-600 text-white"
          : "bg-white text-neutral-600 border border-neutral-200"
      }`}
    >
      {label}
    </button>
  );
}
