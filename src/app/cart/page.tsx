"use client"

import { useCartStore } from "@/lib/store"
import Link from "next/link"
import { Trash2, Gamepad2, ArrowRight, ShieldCheck, Zap, Smartphone, Send, Wallet, CreditCard } from "lucide-react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function CartPage() {
  const { items, removeItem, updateQuantity, getCartTotal, clearCart } = useCartStore()
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedPayment, setSelectedPayment] = useState<string>('vodafone')
  const [isProcessing, setIsProcessing] = useState(false)

  const [isMounted, setIsMounted] = useState(false)

  // Wait until mounted to prevent hydration errors from localStorage store
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleCheckout = async () => {
    if (!session) {
      router.push('/login?callbackUrl=/cart')
      return
    }

    setIsProcessing(true)

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({ id: i.id, quantity: i.quantity })),
          paymentMethod: selectedPayment.toUpperCase() === "CARD" ? "CREDIT_CARD" : selectedPayment.toUpperCase()
        })
      })

      if (res.ok) {
        const data = await res.json()
        clearCart() // Clear cart upon successful order creation
        router.push(data.url)
      } else {
        const text = await res.text()
        alert(`Checkout failed: ${text}`)
        setIsProcessing(false)
      }
    } catch (e) {
      console.error(e)
      alert("Checkout error occurred.")
      setIsProcessing(false)
    }
  }

  if (!isMounted) return null

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center" dir="rtl">
        <div className="h-24 w-24 rounded-full bg-[#141417] border border-[#27272a] flex items-center justify-center mb-6">
          <Gamepad2 className="h-10 w-10 text-gray-500" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">عربة التسوق الخاصة بك فارغة</h2>
        <p className="text-gray-400 mb-8 max-w-md">يبدو أنك لم تضف أي منتجات إلى عربتك بعد. اكتشف خدماتنا المميزة للألعاب وشحن الرصيد.</p>
        <Link href="/" className="bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)]">
          متابعة التسوق
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12" dir="rtl">
      <h1 className="text-3xl font-bold text-white mb-8">عربة التسوق ({items.reduce((acc, i) => acc + i.quantity, 0)})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 rounded-xl border border-[#27272a] bg-[#141417] items-center">
              <Link href={`/product/${item.id}`} className="h-20 w-20 bg-[#09090b] border border-[#27272a] hover:border-[#a855f7] rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover rounded-lg" />
                ) : (
                  <Gamepad2 className="h-8 w-8 text-[#a855f7]/50" />
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/product/${item.id}`}>
                  <h3 className="text-lg font-semibold text-white truncate hover:text-[#a855f7] transition-colors">{item.name}</h3>
                </Link>
                <div className="text-[#a855f7] font-bold">{item.price.toFixed(2)} EGP</div>
              </div>

              <div className="flex items-center gap-3 bg-[#09090b] rounded-lg border border-[#27272a] p-1">
                <button
                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white"
                >
                  -
                </button>
                <span className="w-4 text-center text-white text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors ml-2 flex-shrink-0"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-[#27272a] bg-[#141417] p-6 sticky top-24">
            <h2 className="text-xl font-bold text-white mb-6">ملخص الطلب</h2>

            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>المجموع الفرعي</span>
                <span className="text-white" dir="ltr">{getCartTotal().toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>الضريبة (0%)</span>
                <span className="text-white" dir="ltr">0.00 EGP</span>
              </div>
              <div className="h-px bg-[#27272a] my-4" />
              <div className="flex justify-between font-bold text-lg">
                <span className="text-white">الإجمالي</span>
                <span className="text-[#a855f7]" dir="ltr">{getCartTotal().toFixed(2)} EGP</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">طريقة الدفع</h3>
              <div className="space-y-2">
                {[
                  { id: 'vodafone', name: 'فودافون كاش', desc: 'تحويل محلي آمن', icon: <img src="/vodafone-logo.png" alt="VF" className="h-20 w-auto object-contain" /> },
                  { id: 'instapay', name: 'إنستاباي', desc: 'تحويل فوري', icon: <img src="/instapay-logo.png" alt="InstaPay" className="h-20 w-auto object-contain" /> },
                  { id: 'paypal', name: 'باي بال', desc: 'دفع إلكتروني آمن', icon: <img src="/paypal-logo.png" alt="PayPal" className="h-20 w-auto object-contain" /> },
                ].map(method => (
                  <label key={method.id} className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${selectedPayment === method.id ? 'border-[#a855f7] bg-[#a855f7]/10' : 'border-[#27272a] hover:bg-[#27272a]/50'}`}>
                    <input
                      type="radio"
                      name="payment"
                      className="mt-1 accent-[#a855f7]"
                      checked={selectedPayment === method.id}
                      onChange={() => setSelectedPayment(method.id)}
                    />
                    <div className="mr-3 ml-0 flex-1 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">{method.name}</div>
                        <div className="text-xs text-gray-500">{method.desc}</div>
                      </div>
                      <div className="opacity-80 group-hover:opacity-100 transition-opacity mr-auto ml-0">
                        {method.icon}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  إتمام الطلب <ArrowRight className="h-5 w-5 rotate-180" />
                </>
              )}
            </button>

            {!session && (
              <p className="text-xs text-center text-gray-500 mt-4">سيتم طلب تسجيل الدخول قبل إتمام طلبك.</p>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="h-4 w-4 text-green-500" /> مدفوعات آمنة وموثوقة
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Zap className="h-4 w-4 text-blue-500" /> تسليم رقمي فوري
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
