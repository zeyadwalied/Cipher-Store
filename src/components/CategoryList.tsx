import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ProductCarousel } from "@/components/ProductCarousel"
import { ScrollAnimationWrapper } from "@/components/ScrollAnimationWrapper"
import { SubscriptionPromoSection } from "@/components/SubscriptionPromoSection"
import { getCachedCategories, getCachedDiscounts } from "@/lib/dal"

export async function CategoryList() {
    const categories = await getCachedCategories()
    const activeDiscounts = await getCachedDiscounts()

    // Only show Parent Categories on Home Page root level
    const mainCategories = categories.filter((c: any) => !c.parentId)

    return (
        <div className="flex flex-col gap-20">
            {mainCategories.map((category: any, idx: number) => {
                // Determine if this parent or any of its children have products
                const hasProducts = category.products.length > 0 || category.children.some((child: any) => child.products.length > 0)
                const subcategories = category.children || []

                return (
                    <div key={category.id} className="contents">
                        <ScrollAnimationWrapper className="w-full">
                            <section className="relative py-24 overflow-hidden border-b border-[#a855f7]/5">
                                {/* Background Decorations */}
                                <div className="cyber-noise" />

                                {/* Full-Section Background Image Layer */}
                                {(category.backgroundImageUrl || category.imageUrl) && (
                                    <div className="absolute inset-0 z-0 overflow-hidden">
                                        <img
                                            src={category.backgroundImageUrl || category.imageUrl}
                                            alt=""
                                            loading={idx === 0 ? "eager" : "lazy"}
                                            decoding="async"
                                            fetchPriority={idx === 0 ? "auto" : "low"}
                                            className={`absolute inset-0 h-full w-full object-cover ${idx % 2 === 0 ? "object-[45%_center] md:object-[28%_center]" : "object-[55%_center] md:object-[72%_center]"} opacity-[0.24] sm:opacity-[0.28] lg:opacity-[0.22] scale-105`}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-[#010205]/78 via-[#010205]/28 to-[#010205]/82" />
                                        <div className={`absolute inset-0 ${idx % 2 === 0 ? "bg-gradient-to-r from-[#010205]/58 via-transparent to-[#010205]/68" : "bg-gradient-to-l from-[#010205]/58 via-transparent to-[#010205]/68"}`} />
                                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(168,85,247,0.01)_50%)] bg-[length:100%_4px] pointer-events-none" />
                                    </div>
                                )}

                                {/* Ambient Background Orbs */}
                                <div className={`category-orb ${idx % 2 === 0 ? 'category-orb-cyan -top-20 -left-20' : 'category-orb-purple -top-20 -right-20'}`} />
                                <div className={`category-orb ${idx % 2 === 0 ? 'category-orb-purple -bottom-20 -right-20' : 'category-orb-cyan -bottom-20 -left-20'}`} />

                                {/* ─── FULL WIDTH CATEGORY HEADER ─── */}
                                <div className="relative bg-black/40 backdrop-blur-md border-y border-[#a855f7]/30 w-full mb-4 sm:mb-10 py-3 sm:py-10 px-2 sm:px-4 flex flex-col items-center justify-center overflow-hidden shadow-[0_0_60px_rgba(168,85,247,0.15)] min-h-[100px] sm:min-h-[180px]">
                                    {/* Wavy neon lines SVG */}
                                    <svg className="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none" viewBox="0 0 1200 300" preserveAspectRatio="none">
                                        <defs>
                                            <filter id={`neon-purple-${idx}`}><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#a855f7" /><feDropShadow dx="0" dy="0" stdDeviation="15" floodColor="#d946ef" /></filter>
                                            <filter id={`neon-cyan-${idx}`}><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00f5ff" /><feDropShadow dx="0" dy="0" stdDeviation="15" floodColor="#3b82f6" /></filter>
                                            <linearGradient id={`horizon-fade-${idx}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#030712" stopOpacity="0.6" /><stop offset="40%" stopColor="#030712" stopOpacity="0" /><stop offset="100%" stopColor="#030712" stopOpacity="0.8" /></linearGradient>
                                        </defs>
                                        <rect x="0" y="0" width="1200" height="300" fill="#a855f7" opacity="0.05" />
                                        <path d="M-100,80 C 100,70 200,20 250,70 C 350,130 400,0 450,-10 C 500,-20 550,90 650,100 C 750,110 800,30 850,50 C 900,70 1000,120 1300,70" fill="none" stroke="#d946ef" strokeWidth="3" filter={`url(#neon-purple-${idx})`} opacity="0.6" />
                                        <path d="M-100,100 C 150,90 250,50 300,100 C 400,160 500,20 550,40 C 600,60 700,120 800,90 C 900,60 1000,110 1300,100" fill="none" stroke="#a855f7" strokeWidth="2" filter={`url(#neon-purple-${idx})`} opacity="0.4" />
                                        <path d="M-100,270 Q 300,260 600,310 T 1300,270" fill="none" stroke="#a855f7" strokeWidth="5" filter={`url(#neon-purple-${idx})`} opacity="1" />
                                        <path d="M-100,200 C 300,300 500,140 800,260 C 1000,300 1200,180 1300,230" fill="none" stroke="#00f5ff" strokeWidth="2" filter={`url(#neon-cyan-${idx})`} opacity="0.9" />
                                        <rect x="0" y="0" width="1200" height="300" fill={`url(#horizon-fade-${idx})`} />
                                    </svg>

                                    <div className="relative z-10 flex flex-row items-center justify-between w-full max-w-7xl mx-auto gap-2 sm:gap-8 px-2 sm:px-4 py-2 sm:py-8">
                                        <div className="flex flex-row items-center gap-2 sm:gap-6 text-right">
                                            {category.imageUrl && (
                                                <div className="relative shrink-0 group/img">
                                                    <div className={`absolute -inset-1 rounded-xl bg-gradient-to-r ${idx % 2 === 0 ? 'from-[#00f5ff] to-[#a855f7]' : 'from-[#a855f7] to-[#00f5ff]'} opacity-30 group-hover/img:opacity-70 blur-md transition duration-500`} />
                                                    <div className={`relative h-14 w-14 sm:h-24 sm:w-24 md:h-32 md:w-32 rounded-xl bg-transparent border-2 ${idx % 2 === 0 ? 'border-[#00f5ff]/70 shadow-[0_0_10px_rgba(0,245,255,0.5),inset_0_0_10px_rgba(0,245,255,0.5)] sm:shadow-[0_0_15px_rgba(0,245,255,0.5),inset_0_0_15px_rgba(0,245,255,0.5)]' : 'border-[#a855f7]/70 shadow-[0_0_10px_rgba(168,85,247,0.5),inset_0_0_10px_rgba(168,85,247,0.5)] sm:shadow-[0_0_15px_rgba(168,85,247,0.5),inset_0_0_15px_rgba(168,85,247,0.5)]'} overflow-hidden flex items-center justify-center group-hover/img:border-opacity-100 transition-all duration-500`}>
                                                        <img
                                                            src={category.imageUrl}
                                                            alt={category.name}
                                                            loading="lazy"
                                                            decoding="async"
                                                            fetchPriority="low"
                                                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500"
                                                        />
                                                        <div className="absolute inset-x-0 h-px bg-white/40 top-0 animate-[scan_2s_linear_infinite] pointer-events-none shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex flex-col items-start mt-0">
                                                <h2 className="text-xl sm:text-4xl md:text-5xl font-black font-cyber tracking-[0.1em] text-white my-0.5 sm:my-1 uppercase" style={{ textShadow: idx % 2 === 0 ? "0 0 10px rgba(0,245,255,0.6)" : "0 0 10px rgba(168,85,247,0.8)" }}>
                                                    {category.name}
                                                </h2>
                                                {category.description && (
                                                    <p className="text-gray-200 mt-1 sm:mt-2 text-[10px] sm:text-xs md:text-sm font-mono max-w-xl leading-relaxed bg-[#010205]/70 px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg border border-[#a855f7]/30 backdrop-blur-sm hidden sm:block text-right">
                                                        {category.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="shrink-0 mt-2 sm:mt-6 md:mt-0 md:absolute md:left-8">
                                            <Link
                                                href={`/category/${category.slug || category.id}`}
                                                className={`flex items-center gap-1.5 sm:gap-2 border ${idx % 2 === 0 ? 'border-[#00f5ff]/30 hover:border-[#00f5ff] hover:text-[#00f5ff]' : 'border-[#a855f7]/30 hover:border-[#a855f7] hover:text-[#a855f7]'} px-3 py-1.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl bg-[#010205]/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] transition-all duration-300 group/btn shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                                            >
                                                اكثر
                                                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 rotate-180 transition-transform group-hover/btn:-translate-x-1" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                                    {hasProducts ? (
                                        <div className="-mx-4 sm:mx-0">
                                            <ProductCarousel
                                                products={[...category.products, ...subcategories.flatMap((s: any) => s.products)].slice(0, 16)}
                                                globalDiscounts={activeDiscounts}
                                            />
                                        </div>
                                    ) : (
                                        <div className="-mx-4 sm:mx-0">
                                            <div className="flex gap-5 overflow-hidden pb-4 pt-10">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div key={i} className="min-w-[280px] w-[calc(25%-15px)] flex-shrink-0">
                                                        <div className="relative flex flex-col h-full bg-[#0a0a0c] rounded-2xl border border-white/5 overflow-hidden">
                                                            <div className="relative aspect-[4/3] w-full bg-[#0f0f12] animate-pulse">
                                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-[shimmer_2s_infinite]" />
                                                            </div>
                                                            <div className="p-5 space-y-3">
                                                                <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
                                                                <div className="h-3 w-1/2 rounded bg-white/5 animate-pulse" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-center text-gray-600 text-xs font-mono mt-2 mb-4">&gt;&gt; لا توجد منتجات حالياً في هذا القسم</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </ScrollAnimationWrapper>

                        {idx === 1 && (
                            <section className="relative w-full py-6 md:py-16 my-6 overflow-hidden border-y border-[#1DB954]/30">
                                <div className="absolute inset-0 z-0">
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#010205] via-[#010205]/95 to-[#010205]/40 md:rtl:bg-gradient-to-l" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#010205] via-transparent to-[#010205]" />
                                    <div className="absolute top-1/4 -left-1/4 w-[150%] h-[2px] bg-gradient-to-r from-transparent via-[#1DB954] to-transparent rotate-[25deg] shadow-[0_0_15px_#1DB954] opacity-50" />
                                    <div className="absolute bottom-1/4 -right-1/4 w-[150%] h-[2px] bg-gradient-to-l from-transparent via-[#1DB954] to-transparent rotate-[25deg] shadow-[0_0_15px_#1DB954] opacity-50" />
                                    <div className="absolute top-1/4 -right-1/4 w-[150%] h-[2px] bg-gradient-to-l from-transparent via-[#5865F2] to-transparent -rotate-[25deg] shadow-[0_0_15px_#5865F2] opacity-50" />
                                    <div className="absolute bottom-1/4 -left-1/4 w-[150%] h-[2px] bg-gradient-to-r from-transparent via-[#5865F2] to-transparent -rotate-[25deg] shadow-[0_0_15px_#5865F2] opacity-50" />
                                    <div className="cyber-noise opacity-30 z-0" />
                                    <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(29,185,84,0.03)_50%)] bg-[length:100%_4px] pointer-events-none z-0" />
                                </div>
                                <SubscriptionPromoSection />
                            </section>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
