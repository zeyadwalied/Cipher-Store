export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div className="h-10 w-56 rounded-lg bg-[#141417] border border-[#27272a] animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-[#141417] border border-[#27272a] animate-pulse" />
        ))}
      </div>
      <div className="h-80 rounded-xl bg-[#141417] border border-[#27272a] animate-pulse" />
    </div>
  )
}
