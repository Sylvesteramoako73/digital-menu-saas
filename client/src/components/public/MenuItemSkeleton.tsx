export default function MenuItemSkeleton() {
  return (
    <div className="flex flex-row gap-3 mx-4 mb-3 p-3 rounded-2xl bg-white shadow-sm border border-neutral-100 animate-pulse">
      <div className="aspect-square w-24 rounded-xl bg-neutral-200 shrink-0" />
      <div className="flex flex-col justify-between min-w-0 flex-1 py-1">
        <div>
          <div className="h-4 w-3/4 rounded bg-neutral-200" />
          <div className="h-3 w-full rounded bg-neutral-200 mt-2" />
          <div className="h-3 w-2/3 rounded bg-neutral-200 mt-1.5" />
        </div>
        <div className="h-4 w-1/4 rounded bg-neutral-200 mt-1" />
      </div>
    </div>
  );
}

export function MenuItemSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, idx) => (
        <MenuItemSkeleton key={idx} />
      ))}
    </div>
  );
}
