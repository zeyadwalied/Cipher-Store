"use client"

import { useState } from "react"
import Link from "next/link"
import { HelpCircle, MessageSquare, LifeBuoy, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { CyberBackgroundBranches } from "@/components/CyberBackgroundBranches"

export default function SupportPage() {
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const router = useRouter()

  const handleStartChat = async () => {
    if (isCreatingChat) return
    setIsCreatingChat(true)

    try {
      const res = await fetch('/api/chats/support')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to create chat')
      }
      const chat = await res.json()
      router.push(`/chat/${chat.id}`)
    } catch (error) {
      console.error(error)
      alert("عذراً، حدث خطأ أثناء بدء المحادثة. يرجى المحاولة مرة أخرى.")
    } finally {
      setIsCreatingChat(false)
    }
  }

  return (
    <CyberBackgroundBranches
      primaryColor="#a855f7"
      secondaryColor="#00f5ff"
      accentColor="#ff0055"
      opacity={0.15}
      className="min-h-screen py-12"
    >
      <div className="container mx-auto px-4 max-w-6xl relative z-10" dir="rtl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 font-cyber uppercase glitch" data-text="قنوات الدعم">
            قنوات الدعم
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            نحن متاحون على مدار الساعة طوال أيام الأسبوع للإجابة على أسئلتك وحل مشكلاتك وإرشادك خلال خدماتنا.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Support options relocated to center */}

          {/* Live Chat Support */}
          <button
            onClick={handleStartChat}
            disabled={isCreatingChat}
            className="group relative bg-[#0a0a14]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-[#00f5ff]/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,245,255,0.15)] text-center overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0,245,255,0.1), transparent 70%)' }} />

            <div className="h-16 w-16 rounded-2xl bg-[#00f5ff]/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 border border-[#00f5ff]/20">
              {isCreatingChat ? <Loader2 className="h-8 w-8 text-[#00f5ff] animate-spin" /> : <MessageSquare className="h-8 w-8 text-[#00f5ff]" />}
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-cyber tracking-wide">المحادثة المباشرة</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">تحدث مع أحد ممثلي الدعم الفني أو المساعد الذكي مباشرة للحصول على حلول فورية.</p>
            <span className="inline-flex items-center gap-2 text-[#00f5ff] font-black text-xs uppercase tracking-widest border border-[#00f5ff]/20 px-5 py-2.5 rounded-xl group-hover:bg-[#00f5ff] group-hover:text-white transition-all duration-300">
              {isCreatingChat ? "جاري التحويل..." : "بدء المحادثة →"}
            </span>
          </button>

          {/* FAQ / Knowledge Base */}
          <Link
            href="/faq"
            className="group relative bg-[#0a0a14]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-[#a855f7]/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(168,85,247,0.15)] text-center overflow-hidden"
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(168,85,247,0.1), transparent 70%)' }} />

            <div className="h-16 w-16 rounded-2xl bg-[#a855f7]/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 border border-[#a855f7]/20">
              <HelpCircle className="h-8 w-8 text-[#a855f7]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-cyber tracking-wide">قاعدة المعرفة</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">تصفح قائمتنا الشاملة للأسئلة الشائعة للحصول على إجابات سريعة.</p>
            <span className="inline-flex items-center gap-2 text-[#a855f7] font-black text-xs uppercase tracking-widest border border-[#a855f7]/20 px-5 py-2.5 rounded-xl group-hover:bg-[#a855f7] group-hover:text-white transition-all duration-300">
              اقرأ الأسئلة &rarr;
            </span>
          </Link>
        </div>

        {/* Support Section Footer */}
        <div className="mt-20 pt-20 border-t border-white/5 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#ff0055]/10 border border-[#ff0055]/20 text-[#ff0055] text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-[0_0_15px_rgba(255,0,85,0.1)]">
            <LifeBuoy className="w-4 h-4" />
            نظام الدعم الفني والمتطور
          </div>
          <h2 className="text-3xl font-black text-white mb-4 font-cyber uppercase tracking-tight">دعم فني متكامل</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-base">فريقنا جاهز دائمًا لمساعدتك في أي استفسار أو مشكلة تواجهك في خدماتنا بجميع القنوات المتوفرة.</p>
        </div>
      </div>
    </CyberBackgroundBranches>
  )
}
