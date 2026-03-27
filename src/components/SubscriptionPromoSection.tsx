"use client"

import Image from "next/image"
import { useState } from "react"
import { AnimatedPromoLogos } from "./AnimatedPromoLogos"
import { SubscriptionModal } from "./SubscriptionModal"
import { Music, Disc } from "lucide-react"

export function SubscriptionPromoSection() {
  const [activeModal, setActiveModal] = useState<"spotify" | "nitro" | null>(null)

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 font-cyber">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-6 md:gap-12">

          {/* Split Text Content */}
          <div className="w-full md:w-1/2 text-center md:text-right md:order-2">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-2.5 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 text-[#1DB954] text-[8px] sm:text-[9px] md:text-xs font-mono font-bold tracking-widest mb-3 sm:mb-4">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#1DB954] animate-pulse shadow-[0_0_8px_#1DB954]" />
              PREMIUM SUBSCRIPTIONS
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-2 drop-shadow-lg uppercase leading-tight" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}>
              SPOTIFY <span className="text-gray-400 font-sans tracking-normal opacity-50">&amp;</span> <br className="md:hidden" />
              <span className="text-[#5865F2]" style={{ WebkitTextStroke: '0', textShadow: '0 0 25px rgba(88,101,242,0.6)' }}>NITRO</span>
            </h2>

            <p className="text-gray-400 text-xs sm:text-sm md:text-base font-mono leading-relaxed mb-6 sm:mb-8 max-w-lg mx-auto md:ml-auto md:mr-0 border-b-2 md:border-b-0 md:border-r-2 border-[#1DB954]/50 pb-4 md:pb-0 md:pr-4">
              احصل على اشتراكات سبوتيفاي بريميوم وديسكورد نيترو بأرخص الأسعار وبتفعيل فوري وآمن 100٪ لحسابك الشخصي.
            </p>

            <div className="flex flex-wrap flex-row-reverse gap-3 sm:gap-4 justify-center md:justify-start">
              <button
                onClick={() => setActiveModal("spotify")}
                className="group relative inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 font-bold text-white transition-all duration-300 bg-[#1DB954]/10 border-2 border-[#1DB954]/50 rounded-lg hover:bg-[#1DB954] hover:text-[#010205] hover:border-[#1DB954] hover:shadow-[0_0_20px_rgba(29,185,84,0.5)] hover:-translate-y-1 active:scale-95 overflow-hidden cyber-corner text-sm sm:text-base"
              >
                <div className="absolute inset-0 w-0 bg-white transition-all duration-[300ms] ease-out group-hover:w-full opacity-10" />
                <span className="relative font-cyber tracking-[0.1em] flex items-center gap-1.5 sm:gap-2">
                  سبوتيفاي
                </span>
              </button>
              <button
                onClick={() => setActiveModal("nitro")}
                className="group relative inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 font-bold text-white transition-all duration-300 bg-[#5865F2]/10 border-2 border-[#5865F2]/50 rounded-lg hover:bg-[#5865F2] hover:text-[#010205] hover:border-[#5865F2] hover:shadow-[0_0_20px_rgba(88,101,242,0.5)] hover:-translate-y-1 active:scale-95 overflow-hidden cyber-corner text-sm sm:text-base"
              >
                <div className="absolute inset-0 w-0 bg-white transition-all duration-[300ms] ease-out group-hover:w-full opacity-10" />
                <span className="relative font-cyber tracking-[0.1em] flex items-center gap-1.5 sm:gap-2">
                  نيترو
                </span>
              </button>
            </div>
          </div>

          <AnimatedPromoLogos />
        </div>
      </div>

      {/* Spotify Modal */}
      <SubscriptionModal
        isOpen={activeModal === "spotify"}
        onClose={() => setActiveModal(null)}
        title="اشتراك سبوتيفاي بريميوم"
        subtitle="أرسل طلبك الآن وسنتواصل معك فوراً"
        icon={<Image src="/Cyberpunk-Spotify-logo.webp" className="w-10 h-10 object-contain" alt="Spotify" width={1536} height={1024} sizes="40px" />}
        iconBgColor="rgba(29, 185, 84, 0.125)"
        iconColor="#1DB954"
        plans={[
          { id: "1m", name: "شهر واحد (Individual)" },
          { id: "3m", name: "3 أشهر (Individual)" },
          { id: "6m", name: "6 أشهر (Individual)" },
          { id: "12m", name: "سنة كاملة (Individual)" },
          { id: "family", name: "اشتراك عائلي / Family" },
        ]}
        initialMessage="مرحباً، أريد الاستفسار عن اشتراك سبوتيفاي بريميوم."
      />

      {/* Nitro Modal */}
      <SubscriptionModal
        isOpen={activeModal === "nitro"}
        onClose={() => setActiveModal(null)}
        title="اشتراك ديسكورد نيترو"
        subtitle="أرسل طلبك الآن وسنتواصل معك فوراً"
        icon={<Image src="/NITRO-LOGO.webp" className="w-10 h-10 object-contain" alt="Nitro" width={1024} height={1024} sizes="40px" />}
        iconBgColor="rgba(88, 101, 242, 0.125)"
        iconColor="#5865F2"
        plans={[
          { id: "nitro_full_m", name: "Nitro Full (1 month)" },
          { id: "nitro_basic_m", name: "Nitro Basic (1 month)" },
          { id: "nitro_full_y", name: "Nitro Full (1 year)" },
          { id: "nitro_basic_y", name: "Nitro Basic (1 year)" },
        ]}
        initialMessage="مرحباً، أريد الاستفسار عن اشتراك ديسكورد نيترو."
      />
    </>
  )
}
