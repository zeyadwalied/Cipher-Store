"use client"

import { useRef } from "react"
import Link from "next/link"
import { ChevronRight, ChevronLeft, ShoppingCart } from "lucide-react"
import { calculateDiscount, Discount } from "@/lib/discountEngine"

import { motion } from "framer-motion"

export function ProductCarousel({ products, globalDiscounts = [] }: { products: any[], globalDiscounts?: Discount[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const slide = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      if (direction === 'left') {
        scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      } else {
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      }
    }
  }

  if (!products || products.length === 0) return null;

  return (
    <div className="relative group">
      {/* Navigation Buttons */}
      {products.length > 4 && (
        <>
          <button
            onClick={() => slide('right')}
            className="absolute right-1 sm:-right-5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-[#141417]/80 sm:bg-[#141417] border border-[#a855f7]/50 text-[#a855f7] hover:bg-[#a855f7] hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            aria-label="Previous"
          >
            <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
          </button>
          <button
            onClick={() => slide('left')}
            className="absolute left-1 sm:-left-5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-[#141417]/80 sm:bg-[#141417] border border-[#a855f7]/50 text-[#a855f7] hover:bg-[#a855f7] hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            aria-label="Next"
          >
            <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
          </button>
        </>
      )}

      {/* Track */}
      <div
        ref={scrollContainerRef}
        className={`flex items-stretch gap-3 sm:gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 pt-10 px-2 sm:px-0 scroll-smooth ${products.length < 3 ? 'justify-center sm:justify-start lg:justify-center' : products.length < 4 ? 'lg:justify-center' : ''}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', transform: 'translateX(-15px)' }}
      >
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            className="min-w-[140px] w-[calc(50vw-14px)] sm:min-w-[250px] sm:w-[calc(50vw-30px)] lg:min-w-[280px] lg:w-[calc(25%-15px)] flex-shrink-0 snap-start"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
          >
            <Link
              href={`/product/${product.slug || product.id}`}
              className="relative flex flex-col group/card h-full bg-[#0a0a0c] rounded-xl sm:rounded-2xl border border-white/5 overflow-hidden transition-all duration-500 hover:border-[#a855f7]/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]"
            >
              {/* Image Section */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#030712]">
                <img
                  src={product.image || "https://placehold.co/600x400/0a0a0c/a855f7?text=Cipher+Store"}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover/card:scale-110 group-hover/card:opacity-90"
                />

                {/* Modern Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-transparent opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent opacity-60" />

                {/* Animated Scanner Line */}
                <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent top-0 opacity-0 group-hover/card:opacity-100 group-hover/card:animate-[scan_2s_linear_infinite] pointer-events-none shadow-[0_0_10px_rgba(0,245,255,0.8)]" />

                {/* Status Badges */}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-2 z-10">
                  {product.stockQuantity === 0 ? (
                    <span className="flex items-center gap-1.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-red-500/10 border border-red-500/20 backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[8px] sm:text-[10px] font-bold text-red-500 tracking-wider uppercase">نفذت الكمية</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-[#00ff41]/10 border border-[#00ff41]/20 backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse shadow-[0_0_5px_#00ff41]" />
                      <span className="text-[8px] sm:text-[10px] font-bold text-[#00ff41] tracking-wider uppercase">متاح</span>
                    </span>
                  )}
                </div>

                {/* Cyberpunk Discount Badge */}
                {(() => {
                  const { bestDiscount } = calculateDiscount(product, globalDiscounts)
                  if (!bestDiscount) return null
                  return (
                    <div className="absolute top-0 right-0 z-20">
                      <div className="relative group/badge">
                        <div
                          className="bg-[#ff0055] text-white font-black text-[10px] sm:text-[13px] px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,0,85,0.6)] border-b-2 border-l-2 border-white/20 transition-all duration-300 group-hover/badge:shadow-[0_0_30px_rgba(255,0,85,0.9)]"
                          style={{
                            clipPath: "polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 40%)"
                          }}
                        >
                          <span className="animate-pulse">{bestDiscount.isPercentage ? `-${bestDiscount.value}%` : `-${bestDiscount.value} EGP`}</span>
                        </div>
                        {/* Glow Behind */}
                        <div className="absolute inset-0 bg-[#ff0055] blur-xl opacity-20 -z-10 group-hover/badge:opacity-40 transition-opacity" />
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Content Section */}
              <div className="flex flex-col flex-1 p-2 sm:p-5 relative z-10">
                <div className="flex flex-col gap-1 mb-2 sm:mb-3 flex-1 min-h-[40px] sm:min-h-[50px]">
                  <h3 className="text-white font-bold text-xs sm:text-base leading-tight group-hover/card:text-[#00f5ff] transition-colors line-clamp-1 h-[1.25em] sm:h-[1.5em] overflow-hidden">
                    {product.name}
                  </h3>
                  <p className="hidden sm:block text-xs text-gray-400 font-mono line-clamp-2 leading-relaxed mt-1">
                    {product.description}
                  </p>
                </div>

                <div className="flex items-end justify-between mt-auto pt-3 sm:pt-4 border-t border-white/5">
                  <div className="flex flex-col">
                    {product.stockQuantity === 0 ? (
                      <span className="text-sm sm:text-lg font-black font-cyber text-red-500 tracking-widest opacity-80">نفذت الكمية</span>
                    ) : (() => {
                      const { finalPrice, originalPrice, bestDiscount } = calculateDiscount(product, globalDiscounts)
                      return bestDiscount ? (
                        <>
                          <span className="text-[10px] sm:text-[12px] text-gray-500 line-through font-mono mb-0.5 opacity-80 decoration-[#ff0055]/50 decoration-2">{originalPrice.toFixed(2)} EGP</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base sm:text-xl font-black font-cyber text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{finalPrice.toFixed(2)}</span>
                            <span className="text-[8px] sm:text-[10px] text-[#00f5ff] font-bold">EGP</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-base sm:text-xl font-black font-cyber text-white">{product.price.toFixed(2)}</span>
                          <span className="text-[8px] sm:text-[10px] text-[#00f5ff] font-bold">EGP</span>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Modern Purchase Button */}
                  <div className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${product.stockQuantity === 0
                    ? "bg-red-900/10 border-red-500/30 group-hover/card:bg-red-500/20 group-hover/card:border-red-500/50 group-hover/card:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    : "bg-[#a855f7]/10 border-[#a855f7]/30 group-hover/card:bg-[#a855f7] group-hover/card:border-[#a855f7] group-hover/card:shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                    }`}>
                    <div className={`px-2 py-1.5 sm:px-4 sm:py-2 text-[9px] sm:text-[11px] font-bold transition-colors ${product.stockQuantity === 0 ? "text-red-400 group-hover/card:text-red-300" : "text-[#c084fc] group-hover/card:text-white"
                      }`}>
                      {product.stockQuantity === 0 ? "تفاصيل" : <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Glowing Accent Line */}
              <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#a855f7] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
