export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 h-6 w-40 rounded bg-[#141417] animate-pulse ml-auto" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-square rounded-2xl border border-[#27272a] bg-[#141417] animate-pulse" />
        <div className="space-y-6">
          <div className="h-12 w-3/4 rounded bg-[#141417] animate-pulse" />
          <div className="h-6 w-40 rounded bg-[#141417] animate-pulse" />
          <div className="h-16 w-56 rounded bg-[#141417] animate-pulse" />
          <div className="h-32 rounded-xl border border-[#27272a] bg-[#141417] animate-pulse" />
          <div className="space-y-3 border-b border-[#27272a] pb-8">
            <div className="h-5 w-32 rounded bg-[#141417] animate-pulse" />
            <div className="h-4 w-full rounded bg-[#141417] animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-[#141417] animate-pulse" />
            <div className="h-4 w-4/6 rounded bg-[#141417] animate-pulse" />
          </div>
          <div className="h-14 rounded-xl bg-[#141417] animate-pulse" />
        </div>
      </div>
    </div>
  )
}
