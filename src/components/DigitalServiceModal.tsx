"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send, Check, DollarSign, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface DigitalServiceModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    subtitle: string
    icon: React.ReactNode
    iconBgColor: string
    iconColor: string
    projectTypes: string[]
    initialMessage: string
}

export function DigitalServiceModal({
    isOpen,
    onClose,
    title,
    subtitle,
    icon,
    iconBgColor,
    iconColor,
    projectTypes,
    initialMessage
}: DigitalServiceModalProps) {
    const [selectedType, setSelectedType] = useState(projectTypes[0] || "")
    const [budget, setBudget] = useState("")
    const [details, setDetails] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

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

        const messageContent = `${initialMessage}\n\n🏷️ **Service Type:** ${selectedType}\n💰 **Proposed Budget:** ${budget}\n📝 **Details:** ${details || 'No additional details'}`

        try {
            const chatRes = await fetch('/api/chats/support')
            if (!chatRes.ok) {
                if (chatRes.status === 401) {
                    alert("الرجاء تسجيل الدخول أولاً لطلب الخدمة.")
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="rtl">
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
                    className="relative w-full max-w-lg bg-[#0c0c11] border border-[#00f5ff]/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,245,255,0.1)] flex flex-col max-h-[90vh]"
                >
                    {/* Cyber accents */}
                    <div className="absolute top-0 right-0 w-16 h-1 bg-gradient-to-l from-[#00f5ff] to-transparent" />
                    <div className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-r from-[#a855f7] to-transparent" />

                    <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar shrink-0">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4 sm:mb-8">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div
                                    className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
                                    style={{ backgroundColor: iconBgColor, color: iconColor }}
                                >
                                    {icon}
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-2xl font-black text-white font-cyber tracking-tight uppercase leading-none mb-1">{title}</h2>
                                    <p className="text-[9px] sm:text-xs text-gray-400 font-mono tracking-wider leading-none uppercase">{subtitle}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                type="button"
                                aria-label="Close digital service modal"
                                title="Close"
                                className="p-1 sm:p-2 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
                            {/* project type selection */}
                            <div>
                                <label className="block text-[11px] sm:text-sm font-bold text-gray-300 mb-2 sm:mb-3 uppercase tracking-widest font-mono">نوع الخدمة المطلوبة *</label>
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    {projectTypes.map((type) => (
                                        <label
                                            key={type}
                                            className={`flex items-center p-2 sm:p-4 border rounded-2xl cursor-pointer transition-all ${selectedType === type
                                                ? "border-[#00f5ff] bg-[#00f5ff]/10 shadow-[0_0_15px_rgba(0,245,255,0.1)]"
                                                : "border-[#27272a] hover:border-gray-600 bg-[#141417]"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="projectType"
                                                value={type}
                                                className="sr-only"
                                                checked={selectedType === type}
                                                onChange={() => setSelectedType(type)}
                                                required
                                            />
                                            <div className="flex items-center gap-2 sm:gap-3 w-full">
                                                <div className={`w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${selectedType === type ? "border-[#00f5ff] bg-[#00f5ff]" : "border-gray-600"
                                                    }`}>
                                                    {selectedType === type && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />}
                                                </div>
                                                <span className={`text-[10px] sm:text-sm font-bold leading-tight ${selectedType === type ? "text-white" : "text-gray-400"}`}>
                                                    {type}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Budget input */}
                            <div>
                                <label className="block text-[11px] sm:text-sm font-bold text-gray-300 mb-2 sm:mb-3 uppercase tracking-widest font-mono">الميزانية المقترحة * (EGP / $)</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-[#00f5ff]">
                                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="مثال: 50$ أو 2000 جنيه"
                                        required
                                        className="w-full bg-[#141417] border border-[#27272a] rounded-2xl pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-white focus:outline-none focus:border-[#00f5ff]/50 transition-all font-mono text-xs sm:text-sm"
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Additional Details */}
                            <div>
                                <label className="block text-[11px] sm:text-sm font-bold text-gray-300 mb-2 sm:mb-3 uppercase tracking-widest font-mono">تفاصيل إضافية (اختياري)</label>
                                <textarea
                                    placeholder="اشرح فكرتك باختصار..."
                                    className="w-full bg-[#141417] border border-[#27272a] rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#00f5ff]/50 transition-all resize-none h-24 sm:h-28 font-sans text-xs sm:text-sm"
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                />
                            </div>

                            {/* Submit */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !budget}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-2xl text-white font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg group text-xs sm:text-base disabled:opacity-50"
                                    style={{
                                        background: 'linear-gradient(135deg, #00f5ff 0%, #00d1ff 100%)',
                                        boxShadow: '0 10px 25px -5px rgba(0,245,255,0.4)',
                                        color: '#010205'
                                    }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                            جاري المعالجة...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 rtl:scale-x-[-1]" />
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
