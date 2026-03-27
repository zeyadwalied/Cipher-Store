export default function SearchLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8 min-h-[70vh]">
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="rounded-xl border border-[#27272a] bg-[#141417] p-6 space-y-6">
          <div className="h-7 w-24 rounded bg-[#1c1c20] animate-pulse" />
          <div className="space-y-3">
            <div className="h-4 w-20 rounded bg-[#1c1c20] animate-pulse" />
            <div className="h-10 rounded-lg bg-[#09090b] animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-28 rounded bg-[#1c1c20] animate-pulse" />
            <div className="flex gap-2">
              <div className="h-10 flex-1 rounded-lg bg-[#09090b] animate-pulse" />
              <div className="h-10 flex-1 rounded-lg bg-[#09090b] animate-pulse" />
            </div>
          </div>
          <div className="h-10 rounded-lg bg-[#1c1c20] animate-pulse" />
        </div>
      </div>
      <div className="flex-1">
        <div className="mb-8 space-y-3">
          <div className="h-10 w-64 rounded bg-[#141417] animate-pulse" />
          <div className="h-5 w-40 rounded bg-[#141417] animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-[#27272a] bg-[#141417]">
              <div className="aspect-[4/3] w-full bg-[#09090b] animate-pulse" />
              <div className="p-5 space-y-4">
                <div className="h-4 w-24 rounded bg-[#1c1c20] animate-pulse" />
                <div className="h-6 w-3/4 rounded bg-[#1c1c20] animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-[#1c1c20] animate-pulse" />
                  <div className="h-4 w-2/3 rounded bg-[#1c1c20] animate-pulse" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="h-6 w-28 rounded bg-[#1c1c20] animate-pulse" />
                  <div className="h-10 w-16 rounded-lg bg-[#1c1c20] animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
