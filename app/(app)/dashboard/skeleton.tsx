// Skeleton for the dashboard — shared by the route-transition loading.tsx
// (streaming/partial-prefetch per the linking-and-navigating docs) and the
// in-component fetch state. File 05: skeleton loaders, never blank screens.
// Mirrors the hero-first layout: gauge + insight, KPI row, feed + actions.
export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Refresh strip */}
      <div className="shimmer h-4 w-40 rounded" />
      {/* Hero */}
      <div className="card-hero grid gap-10 p-7 sm:grid-cols-[auto_1fr] sm:p-10">
        <div className="shimmer h-44 w-44 shrink-0 rounded-full" />
        <div className="space-y-4">
          <div className="shimmer h-3 w-28 rounded" />
          <div className="shimmer h-12 w-72 max-w-full rounded" />
          <div className="shimmer h-4 w-56 rounded" />
          <div className="shimmer mt-4 h-16 w-full rounded-xl" />
        </div>
      </div>
      {/* Companion */}
      <div className="card-primary space-y-4 p-6">
        <div className="shimmer h-3 w-24 rounded" />
        <div className="shimmer h-8 w-64 max-w-full rounded" />
        <div className="shimmer h-11 w-full rounded-full" />
      </div>
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-quiet p-5">
            <div className="shimmer h-3 w-20 rounded" />
            <div className="shimmer mt-3 h-7 w-24 rounded" />
          </div>
        ))}
      </div>
      {/* Activity trend */}
      <div className="card-primary p-6">
        <div className="shimmer h-3 w-44 rounded" />
        <div className="mt-5 flex h-28 items-end gap-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="shimmer flex-1 rounded-t" style={{ height: `${20 + ((i * 37) % 80)}%` }} />
          ))}
        </div>
      </div>
      {/* Feed + actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-primary h-56 p-6 lg:col-span-2"><div className="shimmer h-full w-full rounded" /></div>
        <div className="card-primary h-56 p-6"><div className="shimmer h-full w-full rounded" /></div>
      </div>
    </div>
  )
}
