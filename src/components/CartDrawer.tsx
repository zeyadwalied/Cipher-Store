"use client"

import { useCartStore } from "@/lib/store"
import Link from "next/link"
import { Gamepad2, ArrowRight, Trash2, X, ShoppingCart } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, getCartTotal } = useCartStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)

  // Prevent hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Close drawer on route change and reset navigating state
  useEffect(() => {
    setIsOpen(false)
    setIsNavigating(false)
  }, [pathname, setIsOpen])

  if (!isMounted) return null

  // If the user clicks on the backdrop
  const handleOverlayClick = () => setIsOpen(false)

  const handleCheckoutClick = () => {
    setIsNavigating(true)
    router.push("/cart")
  }

  return (
    <>
      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          onClick={handleOverlayClick}
        />
      )}

      {/* Cart Drawer sliding from Right to Left */}
      <div
        dir="rtl"
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] z-[110] bg-[#09090b] border-l border-[#27272a] shadow-2xl flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#27272a] bg-[#141417]">
          <div className="flex items-center gap-3 text-white font-bold text-lg">
            <ShoppingCart className="h-5 w-5 text-[#a855f7]" />
            السلة ({items.reduce((acc, i) => acc + i.quantity, 0)})
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-400 hover:text-white bg-[#09090b] border border-[#27272a] rounded-lg transition-colors hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 group"
          >
            <X className="h-4 w-4 transform group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-[#141417] border border-[#27272a] flex items-center justify-center mb-2">
                <Gamepad2 className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white">السلة فارغة</h3>
              <p className="text-sm text-gray-400">لم تقم بإضافة أي منتجات للسلة بعد.</p>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-4 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] text-sm"
              >
                تصفح المنتجات
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 p-3 rounded-xl border border-[#27272a] bg-[#141417] items-center relative overflow-hidden group">
                {/* Glowing subtle edge effect internally */}
                <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-[#a855f7] to-[#00f5ff] opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <Link href={`/product/${item.id}`} onClick={() => setIsOpen(false)} className="h-16 w-16 bg-[#09090b] border border-[#27272a] rounded-lg flex items-center justify-center flex-shrink-0 transition-colors z-10 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <Gamepad2 className="h-6 w-6 text-[#a855f7]/50" />
                  )}
                </Link>

                <div className="flex-1 min-w-0 z-10 flex flex-col gap-1">
                  <Link href={`/product/${item.id}`} onClick={() => setIsOpen(false)}>
                    <h4 className="text-sm font-semibold text-white truncate hover:text-[#a855f7] transition-colors pr-1">{item.name}</h4>
                  </Link>
                  <div className="text-[#a855f7] font-bold text-sm pr-1">{item.price.toFixed(2)} EGP</div>
                  
                  {/* Quantity Control within Drawer */}
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex items-center bg-[#09090b] rounded border border-[#27272a]">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white bg-[#09090b] rounded-r transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value)
                          if (!isNaN(val) && val > 0) {
                            updateQuantity(item.id, val)
                          }
                        }}
                        className="w-7 text-center bg-transparent border-none text-white text-xs font-medium focus:outline-none focus:ring-0 p-0 appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white bg-[#27272a]/50 rounded-l transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col h-16 justify-between items-end z-10">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500/70 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div className="p-4 border-t border-[#27272a] bg-[#141417] space-y-4">
             <div className="flex items-center justify-between font-bold text-lg px-1">
              <span className="text-white font-cyber tracking-wider">TOTAL</span>
              <span className="text-[#a855f7]">{getCartTotal().toFixed(2)} EGP</span>
            </div>
            
            <button
              onClick={handleCheckoutClick}
              disabled={isNavigating}
              className="w-full bg-white hover:bg-gray-100 text-black font-extrabold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isNavigating ? (
                <div className="h-5 w-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              ) : (
                <>
                  استكمال الدفع
                  <ArrowRight className="h-5 w-5 transform rotate-180 group-hover:-translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
