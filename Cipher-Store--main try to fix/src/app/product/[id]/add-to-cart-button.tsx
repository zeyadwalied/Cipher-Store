"use client"

import { useCartStore } from "@/lib/store"
import { ShoppingCart, CheckCircle2, ArrowRight, ShoppingBag } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function AddToCartButton({ 
  product 
}: { 
  product: { 
    id: string; 
    name: string; 
    price: number; 
    image?: string;
    stockQuantity?: number | null;
  } 
}) {
  const addItem = useCartStore((state) => state.addItem)
  const [isAdded, setIsAdded] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  const handleAdd = () => {
    addItem({ ...product, quantity: 1 })
    setIsAdded(true)
    setShowModal(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  return (
    <>
      <div className="flex gap-4">
        <button 
          onClick={handleAdd}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all
            ${isAdded 
              ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
              : 'bg-[#a855f7] text-white hover:bg-[#9333ea] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]'
            }`}
        >
          <ShoppingCart className="h-5 w-5 ml-2" />
          {isAdded ? 'تمت الإضافة للعربة!' : 'أضف للعربة'}
        </button>

        <button 
          onClick={() => {
            if(!isAdded) addItem({ ...product, quantity: 1 })
            router.push('/cart')
          }}
          className="flex-1 bg-[#141417] text-white border border-[#27272a] hover:border-[#a855f7] rounded-xl font-bold py-4 transition-colors"
        >
          اشترِ الآن
        </button>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-[#141417] border border-[#27272a] rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">تمت إضافة المنتج للعربة!</h3>
              <p className="text-gray-400 text-sm mb-6" dir="rtl">
                <span className="text-white font-medium">{product.name}</span> تمت إضافته بنجاح السلة التسوق.
              </p>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-3 rounded-xl bg-[#27272a] text-white text-sm font-bold hover:bg-[#3f3f46] transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="h-4 w-4 ml-2" />
                  متابعة
                </button>
                <Link 
                  href="/cart"
                  className="px-4 py-3 rounded-xl bg-[#a855f7] text-white text-sm font-bold hover:bg-[#9333ea] transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2 flex-row-reverse"
                >
                  الذهاب للعربة
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
