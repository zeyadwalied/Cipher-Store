"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Gift, UserPlus, Gamepad2, DollarSign, X, Loader2 } from "lucide-react"

export function SteamGameRequestModal() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [friendCode, setFriendCode] = useState("")
    const [gameName, setGameName] = useState("")
    const [gamePrice, setGamePrice] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const openModal = () => setIsOpen(true)
    const closeModal = () => {
        if (isSubmitting) return
        setIsOpen(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!friendCode.trim() || !gameName.trim() || !gamePrice.trim()) {
            return
        }

        setIsSubmitting(true)

        try {
            const numericPrice = Number.parseFloat(gamePrice)
            const approxEGP = Number.isNaN(numericPrice)
                ? "غير محدد"
                : `${(numericPrice * 55).toFixed(2)} EGP تقريبا`

            const initialMessage = [
                "🎮 طلب شحن لعبة كـ Steam Gift",
                "",
                `🆔 Friend Code: \`${friendCode.trim()}\``,
                `🎲 اسم اللعبة: ${gameName.trim()}`,
                `💵 سعر اللعبة على ستيم: $${gamePrice.trim()} (${approxEGP})`,
            ].join("\n")

            const chatRes = await fetch("/api/chats/support", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ initialMessage }),
            })

            if (!chatRes.ok) {
                if (chatRes.status === 401) {
                    alert("الرجاء تسجيل الدخول أولا لطلب الخدمة")
                    router.push("/login")
                    return
                }

                throw new Error(`Failed to create support chat: ${chatRes.status}`)
            }

            const chat = await chatRes.json()

            setIsOpen(false)
            router.push(`/chat/${chat.id}`)
        } catch (error) {
            console.error(error)
            alert("حدث خطأ أثناء تجهيز محادثة الدعم، يرجى المحاولة مرة أخرى")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <button
                onClick={openModal}
                className="group relative inline-flex items-center justify-center px-4 py-3 font-bold text-white transition-all duration-300 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 hover:border-white/40 overflow-hidden"
            >
                <span className="relative flex items-center gap-2 text-sm">
                    <Gift className="w-4 h-4 text-[#ffd700]" />
                    طلب لعبة مخصص من ستيم
                </span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" dir="rtl">
                    <div className="relative w-full max-w-md bg-[#141417] border border-[#27272a] rounded-2xl shadow-[0_0_50px_rgba(0,245,255,0.1)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#00f5ff] to-[#a855f7]" />

                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        شراء لعبة كـ <strong className="text-[#00f5ff]">Steam Gift</strong>
                                    </h2>
                                    <p className="text-sm text-gray-400">على حسابك الشخصي 🎁</p>
                                </div>
                                <button onClick={closeModal} className="p-1 text-gray-500 hover:text-white rounded-lg transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="text-center mb-6">
                                <p className="text-sm text-gray-400">
                                    أدخل المعلومات ليتم تجهيز محادثة مباشرة مع الدعم وإرسال طلبك لهم.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                        <UserPlus className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={friendCode}
                                        onChange={(e) => setFriendCode(e.target.value)}
                                        placeholder="Steam Friend Code"
                                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl pl-4 pr-12 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00f5ff]/50 focus:ring-1 focus:ring-[#00f5ff]/30 transition-all text-left"
                                        dir="ltr"
                                    />
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                        <Gamepad2 className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={gameName}
                                        onChange={(e) => setGameName(e.target.value)}
                                        placeholder="اسم اللعبة (باللغة الإنجليزية)"
                                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl pl-4 pr-12 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00f5ff]/50 focus:ring-1 focus:ring-[#00f5ff]/30 transition-all text-left"
                                        dir="ltr"
                                    />
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                        <DollarSign className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={gamePrice}
                                        onChange={(e) => setGamePrice(e.target.value)}
                                        placeholder="سعر اللعبة بالدولار ($) على ستيم"
                                        className="w-full bg-[#09090b] border border-[#27272a] rounded-xl pl-4 pr-12 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00f5ff]/50 focus:ring-1 focus:ring-[#00f5ff]/30 transition-all text-left"
                                        dir="ltr"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !friendCode.trim() || !gameName.trim() || !gamePrice.trim()}
                                    className="w-full bg-white hover:bg-gray-100 text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 mt-6 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            جاري تجهيز الشات...
                                        </>
                                    ) : (
                                        "الانتقال لمحادثة الدعم"
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
