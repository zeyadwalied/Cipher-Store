import { ArrowRight } from "lucide-react"

export function CategorySectionSkeleton() {
    return (
        <div className="flex flex-col gap-20">
            {[1, 2].map((i) => (
                <section key={i} className="relative py-24 overflow-hidden border-b border-[#a855f7]/5">
                    {/* Background Decoration */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-[#0a0a0c]/40" />
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(168,85,247,0.01)_50%)] bg-[length:100%_4px] pointer-events-none" />
                    </div>

                    {/* Header Skeleton */}
                    <div className="relative bg-black/40 backdrop-blur-md border-y border-[#a855f7]/20 w-full mb-10 py-10 px-4 flex flex-col items-center justify-center min-h-[180px]">
                        <div className="relative z-10 flex flex-row items-center justify-between w-full max-w-7xl mx-auto gap-8 px-4 py-8">
                            <div className="flex flex-row items-center gap-6">
                                {/* Image Skeleton */}
                                <div className="w-32 h-32 rounded-xl bg-white/5 animate-pulse border border-white/10" />
                                {/* Text Skeleton */}
                                <div className="flex flex-col items-start gap-4">
                                    <div className="h-10 w-64 bg-white/5 animate-pulse rounded-lg" />
                                    <div className="h-4 w-96 bg-white/5 animate-pulse rounded hidden sm:block" />
                                </div>
                            </div>
                            {/* Button Skeleton */}
                            <div className="h-12 w-32 bg-white/5 animate-pulse rounded-xl border border-white/10 hidden md:block" />
                        </div>
                        {/* Wavy line mock */}
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#a855f7]/30 to-transparent animate-pulse" />
                    </div>

                    {/* Carousel Skeleton */}
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="flex gap-6 overflow-hidden">
                            {[1, 2, 3, 4].map((j) => (
                                <div key={j} className="min-w-[280px] w-1/4 flex-shrink-0">
                                    <div className="bg-[#0a0a0c] rounded-2xl border border-white/5 h-[400px] animate-pulse relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                        <div className="h-2/3 bg-white/5" />
                                        <div className="p-5 space-y-4">
                                            <div className="h-4 w-3/4 bg-white/5 rounded" />
                                            <div className="h-4 w-1/2 bg-white/5 rounded" />
                                            <div className="flex justify-between items-center pt-4">
                                                <div className="h-6 w-16 bg-white/5 rounded" />
                                                <div className="h-10 w-24 bg-white/10 rounded-lg" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            ))}
        </div>
    )
}
