"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle: string
  icon: React.ReactNode
  iconBgColor: string
  iconColor: string
  plans: { id: string; name: string }[]
  initialMessage: string
}

export function SubscriptionModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  iconBgColor,
  iconColor,
  plans,
  initialMessage
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState(plans[0]?.id || "")
  const [details, setDetails] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    const planName = plans.find(p => p.id === selectedPlan)?.name
    const messageContent = `${initialMessage}\n\n💎 **Plan:** ${planName}\n📝 **Details:** ${details || 'No additional details'}`

    try {
      const chatRes = await fetch('/api/chats/support')
      if (!chatRes.ok) {
        if (chatRes.status === 401) {
          alert("الرجاء تسجيل الدخول أولاً لطلب الاشتراك.")
          router.push('/login')
          return
        }
        throw new Error('Failed to create chat')
      }
      const chat = await chatRes.json()

      await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent })
      })

      router.push(`/chat/${chat.id}`)
      onClose()
    } catch (error) {
      console.error(error)
      alert("حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-[#0c0c11] border border-[#a855f7]/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)] max-h-[90vh] flex flex-col"
        >
          {/* Cyber accents */}
          <div className="absolute top-0 left-0 w-16 h-1 bg-gradient-to-r from-[#00f5ff] to-transparent z-10" />
          <div className="absolute bottom-0 right-0 w-16 h-1 bg-gradient-to-l from-[#a855f7] to-transparent z-10" />

          {/* Scrollable Container */}
          <div className="overflow-y-auto p-5 sm:p-8 custom-scrollbar">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
                  style={{ backgroundColor: iconBgColor, color: iconColor }}
                >
                  {icon}
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-black text-white font-cyber tracking-tight uppercase leading-tight">{title}</h2>
                  <p className="text-[10px] sm:text-xs text-gray-400 font-mono tracking-wider">{subtitle}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {/* Plan Selection */}
              <div>
                <label className="block text-[11px] sm:text-sm font-bold text-gray-300 mb-3 uppercase tracking-widest font-mono">اختر مدة الاشتراك *</label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {plans.map((plan) => (
                    <label
                      key={plan.id}
                      className={`flex items-center p-2.5 sm:p-4 border rounded-2xl cursor-pointer transition-all ${selectedPlan === plan.id
                        ? "border-[#a855f7] bg-[#a855f7]/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                        : "border-[#27272a] hover:border-gray-600 bg-[#141417]"
                        }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        className="sr-only"
                        checked={selectedPlan === plan.id}
                        onChange={() => setSelectedPlan(plan.id)}
                        required
                      />
                      <div className="flex items-center gap-2 sm:gap-3 w-full">
                        <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${selectedPlan === plan.id ? "border-[#a855f7] bg-[#a855f7]" : "border-gray-600"}`}>
                          {selectedPlan === plan.id && <Check className="w-2.5 h-2.5 sm:w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-xs sm:text-sm font-bold leading-tight ${selectedPlan === plan.id ? "text-white" : "text-gray-400"}`}>
                          {plan.name}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Note */}
              <div className="bg-[#141417] border border-[#27272a] rounded-2xl p-3 sm:p-4">
                <div className="flex justify-between items-center text-[10px] sm:text-sm font-mono tracking-wider">
                  <span className="text-gray-500 uppercase">الميزانية التقريبية:</span>
                  <span className="text-[#00f5ff] font-bold">تحدد مع الدعم الفني</span>
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <label className="block text-[11px] sm:text-sm font-bold text-gray-300 mb-3 uppercase tracking-widest font-mono">تفاصيل إضافية (اختياري)</label>
                <textarea
                  placeholder="إذا كان لديك أي استفسار أو تفضيلات معينة..."
                  className="w-full bg-[#141417] border border-[#27272a] rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#a855f7]/50 transition-all resize-none h-24 sm:h-28 font-sans text-xs sm:text-sm"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl text-white font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg group text-xs sm:text-base disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                    boxShadow: '0 10px 25px -5px rgba(168,85,247,0.4)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      جاري المعالجة...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                      الانتقال لمحادثة الدعم الفني
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
