"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ChevronRight, ChevronLeft, ShoppingCart } from "lucide-react"
import { calculateDiscount, Discount } from "@/lib/discountEngine"
import { CATEGORY_CAROUSEL_LIMIT } from "@/lib/category-preview"
import { useCartStore } from "@/lib/store"

export function ProductCarousel({ products, globalDiscounts = [] }: { products: any[], globalDiscounts?: Discount[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { addItem, setIsOpen } = useCartStore()
  const [loadingProducts, setLoadingProducts] = useState<Record<string, boolean>>({})

  const animateSlide = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const items = scrollContainerRef.current.querySelectorAll<HTMLElement>("[data-carousel-item='true']")
    const offset = direction === 'right' ? 18 : -18

    items.forEach((item, idx) => {
      item.animate(
        [
          { opacity: 0.72, transform: `translateX(${offset}px)` },
          { opacity: 1, transform: "translateX(0px)" }
        ],
        {
          duration: 320,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          delay: Math.min(idx, 5) * 14,
          fill: "both"
        }
      )
    })
  }

  const getSlideDistance = () => {
    if (!scrollContainerRef.current) return 320
    const container = scrollContainerRef.current
    const firstItem = container.querySelector<HTMLElement>("[data-carousel-item='true']")
    if (!firstItem) return container.clientWidth * 0.8

    const computed = window.getComputedStyle(container)
    const gap = Number.parseFloat(computed.columnGap || computed.gap || "0") || 0
    const cardsPerStep = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 2 : 1
    return (firstItem.offsetWidth + gap) * cardsPerStep
  }

  const slide = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      animateSlide(direction)
      const scrollAmount = getSlideDistance()
      if (direction === 'left') {
        scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      } else {
        scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      }
    }
  }

  const displayedProducts = products.slice(0, CATEGORY_CAROUSEL_LIMIT)

  if (displayedProducts.length === 0) return null;

  return (
    <div className="relative group">
      {/* Navigation Buttons */}
      {displayedProducts.length > 4 && (
        <>
          <button
            onClick={() => slide('right')}
            className="absolute right-1 sm:-right-5 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-11 sm:w-11 flex items-center justify-center rounded-xl bg-[#09090b]/90 backdrop-blur-md border border-[#a855f7]/40 text-[#c084fc] hover:border-[#a855f7] hover:bg-[#a855f7]/20 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
            aria-label="Previous"
          >
            <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
          </button>
          <button
            onClick={() => slide('left')}
            className="absolute left-1 sm:-left-5 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-11 sm:w-11 flex items-center justify-center rounded-xl bg-[#09090b]/90 backdrop-blur-md border border-[#a855f7]/40 text-[#c084fc] hover:border-[#a855f7] hover:bg-[#a855f7]/20 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
            aria-label="Next"
          >
            <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
          </button>
        </>
      )}

      {/* Track */}
      <div
        ref={scrollContainerRef}
        className={`flex items-stretch gap-3 sm:gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 pt-10 px-2 sm:px-0 scroll-smooth ${displayedProducts.length < 3 ? 'justify-center sm:justify-start lg:justify-center' : displayedProducts.length < 4 ? 'lg:justify-center' : ''}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayedProducts.map((product) => (
          <div
            key={product.id}
            data-carousel-item="true"
            className="min-w-[140px] w-[calc(50vw-14px)] sm:min-w-[250px] sm:w-[calc(50vw-30px)] lg:min-w-[280px] lg:w-[calc(25%-15px)] flex-shrink-0 snap-start"
          >
            <Link
              href={`/product/${product.slug || product.id}`}
              className="relative flex flex-col group/card h-full bg-[#0a0a0c] rounded-xl sm:rounded-2xl border border-white/5 overflow-hidden transition-all duration-500 hover:border-[#a855f7]/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]"
            >
              {/* Image Section */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#030712]">
                <img
                  src={product.image || "/placeholder-product.svg"}
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
                  <div 
                    onClick={(e) => {
                      if (product.stockQuantity === 0) return;
                      e.preventDefault();
                      setLoadingProducts(prev => ({ ...prev, [product.id]: true }));
                      
                      setTimeout(() => {
                        const { finalPrice } = calculateDiscount(product, globalDiscounts);
                        addItem({
                          id: product.id,
                          name: product.name,
                          price: finalPrice,
                          quantity: 1,
                          image: product.image
                        });
                        setIsOpen(true);
                        setLoadingProducts(prev => ({ ...prev, [product.id]: false }));
                      }, 500);
                    }}
                    className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${product.stockQuantity === 0
                    ? "bg-red-900/10 border-red-500/30 group-hover/card:bg-red-500/20 group-hover/card:border-red-500/50 group-hover/card:shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer"
                    : "bg-[#a855f7]/10 border-[#a855f7]/30 group-hover/card:bg-[#a855f7] group-hover/card:border-[#a855f7] group-hover/card:shadow-[0_0_15px_rgba(168,85,247,0.6)] cursor-pointer"
                    }`}>
                    <div className={`px-2 py-1.5 sm:px-4 sm:py-2 text-[9px] sm:text-[11px] font-bold transition-colors ${loadingProducts[product.id] ? "text-white" : product.stockQuantity === 0 ? "text-red-400 group-hover/card:text-red-300" : "text-[#c084fc] group-hover/card:text-white"
                      }`}>
                      {loadingProducts[product.id] ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white/30 border-t-white animate-spin mx-auto" />
                      ) : product.stockQuantity === 0 ? "تفاصيل" : <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Glowing Accent Line */}
              <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#a855f7] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

