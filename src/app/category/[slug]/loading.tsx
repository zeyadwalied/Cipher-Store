export default function CategoryLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 h-6 w-24 rounded bg-[#141417] animate-pulse ml-auto" />
      <div className="mb-12 border-b border-[#27272a] pb-8 text-right">
        <div className="mb-3 h-10 w-72 rounded bg-[#141417] animate-pulse ml-auto" />
        <div className="h-5 w-96 max-w-full rounded bg-[#141417] animate-pulse ml-auto" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-[#27272a] bg-[#141417]">
            <div className="aspect-[4/3] w-full bg-[#09090b] animate-pulse" />
            <div className="p-5 space-y-4">
              <div className="h-6 w-3/4 rounded bg-[#1c1c20] animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-[#1c1c20] animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-[#1c1c20] animate-pulse" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="h-6 w-28 rounded bg-[#1c1c20] animate-pulse" />
                <div className="h-10 w-10 rounded-lg bg-[#1c1c20] animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
