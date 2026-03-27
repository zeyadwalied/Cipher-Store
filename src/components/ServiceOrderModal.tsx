"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Code, Palette, Monitor, Server, Layers, Cpu, X, Send, Loader2, LucideIcon } from "lucide-react"

const SERVICES_DATA = [
  {
    id: "web-design",
    icon: Code,
    title: 'برمجة مواقع مخصصة',
    desc: 'مواقع عصرية ومتجاوبة',
    color: '#00f5ff',
    img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
    packages: ['موقع كود احترافي (React/Next.js)', 'تطبيق ويب مخصص (Full-Stack)', 'لوحة تحكم (Dashboard)', 'برمجة متجر خاص متطور']
  },
  {
    id: "graphic-design",
    icon: Palette,
    title: 'جرافيك ديزاين',
    desc: 'هوية بصرية احترافية',
    color: '#a855f7',
    img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-original.svg',
    packages: ['تصميم شعار (Logo)', 'هوية بصرية كاملة', 'تصاميم سوشيال ميديا']
  },
  {
    id: "wordpress",
    icon: Monitor,
    title: 'خدمات ووردبريس',
    desc: 'بناء وإدارة المواقع',
    color: '#3b82f6',
    img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/wordpress/wordpress-plain.svg',
    packages: ['متجر ووكومرس (WooCommerce)', 'بورتفوليو شخصي', 'موقع إخباري / مدونة', 'إصلاح وحماية مواقع ووردبريس']
  },
  {
    id: "hosting",
    icon: Server,
    title: 'استضافة',
    desc: 'سيرفرات سريعة وآمنة',
    color: '#00ff41',
    img: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg',
    packages: ['استضافة المواقع (سنة)', 'سيرفر VPS خاص', 'حجز دومين']
  },
  {
    id: "discord-setup",
    icon: Layers,
    title: 'تنظيم سيرفر ديسكورد',
    desc: 'إعداد وتنظيم احترافي',
    color: '#5865F2',
    img: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6ca814282eca7172c6_icon_clyde_white_RGB.svg',
    packages: ['سيرفر أساسي', 'سيرفر احترافي مع بوتات', 'سيرفر مجتمعي ضخم']
  },
  {
    id: "discord-bot",
    icon: Cpu,
    title: 'تطوير بوت ديسكورد',
    desc: 'بوتات مخصصة وذكية',
    color: '#ED4245',
    img: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6ca814282eca7172c6_icon_clyde_white_RGB.svg',
    packages: ['بوت حماية وحظر', 'بوت نظام الاقتصادي والألعاب', 'بوت مخصص بالكامل']
  },
]

export function ServiceOrderModal() {
  const router = useRouter()
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedPackage, setSelectedPackage] = useState("")
  const [budget, setBudget] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openModal = (service: any) => {
    setSelectedService(service)
    setSelectedPackage("")
    setBudget("")
    setNotes("")
  }

  const closeModal = () => {
    if (isSubmitting) return
    setSelectedService(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPackage || !budget) return
    setIsSubmitting(true)

    try {
      // 1. Create or get existing support chat
      const chatRes = await fetch('/api/chats/support')
      if (!chatRes.ok) {
        if (chatRes.status === 401) {
          alert("الرجاء تسجيل الدخول أولاً لطلب الخدمة")
          router.push('/login')
          return
        }
        throw new Error('Failed to create chat')
      }
      const chat = await chatRes.json()

      // 2. Send the initial message with order details
      const messageContent = `🔔 **طلب خدمة جديدة:** ${selectedService.title} \n\n📦 **نوع الخدمة/الباقة:** ${selectedPackage} \n💰 **الميزانية المقترحة:** ${budget} EGP/USD \n📝 **تفاصيل إضافية:** ${notes || 'لا يوجد'}`

      await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent })
      })

      // 3. Redirect to chat
      router.push(`/chat/${chat.id}`)
      closeModal()
    } catch (error) {
      console.error(error)
      alert("حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto px-2">
        {SERVICES_DATA.map((service, sIdx) => (
          <div
            key={sIdx}
            onClick={() => openModal(service)}
            className="group/svc cursor-pointer relative flex flex-col items-center text-center p-4 sm:p-5 rounded-xl bg-[#0a0a0c]/80 border border-white/5 hover:border-[color:var(--svc-color)]/50 transition-all duration-500 backdrop-blur-md overflow-hidden"
            style={{ '--svc-color': service.color } as React.CSSProperties}
          >
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover/svc:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 0%, ${service.color}15, transparent 70%)` }} />

            {/* Tech Logo */}
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 mb-3 rounded-lg flex items-center justify-center" style={{ background: `${service.color}15`, border: `1px solid ${service.color}30` }}>
              <img src={service.img} alt={service.title} className="w-6 h-6 sm:w-7 sm:h-7 opacity-80 group-hover/svc:opacity-100 transition-opacity" />
            </div>

            {/* Icon */}
            <div className="relative mb-2 transition-transform group-hover/svc:scale-110" style={{ color: service.color }}>
              <service.icon className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>

            <h3 className="text-white text-xs sm:text-sm font-bold font-cyber mb-1 group-hover/svc:text-[color:var(--svc-color)] transition-colors">{service.title}</h3>
            <p className="text-gray-500 text-[9px] sm:text-[10px] font-mono">{service.desc}</p>

            {/* Bottom accent */}
            <div className="absolute bottom-0 inset-x-0 h-[2px] opacity-0 group-hover/svc:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${service.color}, transparent)` }} />
          </div>
        ))}
      </div>

      {/* MODAL OVERLAY */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
          <div
            className="relative w-full max-w-lg bg-[#141417] border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            style={{ borderColor: `${selectedService.color}50` }}
          >
            {/* Header Glow */}
            <div className="absolute top-0 inset-x-0 h-1 z-10" style={{ backgroundColor: selectedService.color, boxShadow: `0 0 20px ${selectedService.color}` }} />

            <div className="overflow-y-auto p-4 sm:p-6 custom-scrollbar shrink-0">
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3 sm:gap-4 text-right">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${selectedService.color}20`, color: selectedService.color }}>
                    <selectedService.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-xl font-bold text-white font-cyber leading-tight">{selectedService.title}</h2>
                    <p className="text-[9px] sm:text-xs text-gray-400 font-mono">أرسل طلبك الآن وسنتواصل معك فوراً</p>
                  </div>
                </div>
                <button onClick={closeModal} type="button" aria-label="Close service order modal" title="Close" className="p-1 sm:p-2 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[11px] sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">نوع الخدمة المطلوبة *</label>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {selectedService.packages.map((pkg: string) => (
                      <label
                        key={pkg}
                        className={`flex items-center p-2 sm:p-3 border rounded-xl cursor-pointer transition-all ${selectedPackage === pkg ? 'bg-white/10' : 'border-[#27272a] hover:border-gray-600 bg-[#09090b]'}`}
                        style={{ borderColor: selectedPackage === pkg ? selectedService.color : undefined }}
                      >
                        <input
                          type="radio"
                          name="package"
                          value={pkg}
                          className="sr-only"
                          onChange={() => setSelectedPackage(pkg)}
                          required
                        />
                        <div className="flex items-center gap-3 w-full">
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${selectedPackage === pkg ? 'border-transparent' : 'border-gray-500'}`} style={{ backgroundColor: selectedPackage === pkg ? selectedService.color : 'transparent' }}>
                            {selectedPackage === pkg && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs sm:text-sm text-gray-200 leading-tight">{pkg}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">الميزانية المقترحة * (EGP / $)</label>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="مثال: 50$ أو 2000 جنيه"
                    required
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-2.5 sm:py-3 text-white focus:outline-none focus:border-white/50 transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">تفاصيل إضافية (اختياري)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="اشرح فكرتك باختصار..."
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/50 transition-colors resize-none h-24 text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedPackage || !budget}
                    className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl text-white font-bold transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    style={{ backgroundColor: selectedService.color, boxShadow: `0 0 20px ${selectedService.color}40` }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري تجهيز المحادثة...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 rtl:scale-x-[-1]" />
                        الانتقال لمحادثة الدعم الفني
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
