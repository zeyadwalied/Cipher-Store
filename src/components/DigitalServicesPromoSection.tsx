"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { DigitalServiceModal } from "./DigitalServiceModal"
import { Monitor, Code } from "lucide-react"

export function DigitalServicesPromoSection() {
  const [activeModal, setActiveModal] = useState<"web" | "wordpress" | null>(null)

  return (
    <section className="relative w-full py-16 md:py-24 overflow-hidden border-y border-[#00f5ff]/30 my-20">
      {/* Background with provided HTML elements logic */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#010205] via-[#010205]/95 to-[#010205]/40 md:rtl:bg-gradient-to-l" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#010205] via-transparent to-[#010205]" />

        {/* Neon strikes */}
        <div className="absolute top-1/4 -left-1/4 w-[150%] h-[2px] bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent rotate-[25deg] shadow-[0_0_15px_#00f5ff] opacity-50" />
        <div className="absolute bottom-1/4 -right-1/4 w-[150%] h-[2px] bg-gradient-to-l from-transparent via-[#00f5ff] to-transparent rotate-[25deg] shadow-[0_0_15px_#00f5ff] opacity-50" />
        <div className="absolute top-1/4 -right-1/4 w-[150%] h-[2px] bg-gradient-to-l from-transparent via-[#a855f7] to-transparent -rotate-[25deg] shadow-[0_0_15px_#a855f7] opacity-50" />
        <div className="absolute bottom-1/4 -left-1/4 w-[150%] h-[2px] bg-gradient-to-r from-transparent via-[#a855f7] to-transparent -rotate-[25deg] shadow-[0_0_15px_#a855f7] opacity-50" />

        <div className="cyber-noise opacity-30 z-0" />
      </div>

      {/* Decorative center shapes */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-[#00f5ff]/10 rotate-45 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-[#a855f7]/10 rotate-45 bg-[#a855f7]/5 pointer-events-none" />

      {/* Ambient Glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[400px] bg-[#00f5ff]/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-10 right-0 w-[400px] h-[400px] bg-[#a855f7]/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 font-cyber">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-12">

          {/* Text Content */}
          <div className="w-full md:w-1/2 text-center md:text-right md:order-2">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-[#00f5ff]/10 border border-[#00f5ff]/30 text-[#00f5ff] text-[9px] sm:text-xs font-mono font-bold tracking-widest mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f5ff] animate-pulse shadow-[0_0_8px_#00f5ff]" />
              حلول رقمية
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-3 drop-shadow-lg uppercase leading-tight" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}>
              تطوير <span className="text-[#a855f7]" style={{ WebkitTextStroke: '0', textShadow: '0 0 25px rgba(168,85,247,0.6)' }}>المواقع</span>
            </h2>

            <p className="text-gray-400 text-xs sm:text-sm md:text-lg font-mono leading-relaxed mb-8 max-w-xl mx-auto md:ml-auto md:mr-0 border-b-2 md:border-b-0 md:border-r-2 border-[#a855f7]/50 pb-6 md:pb-0 md:pr-6 leading-relaxed">
              نحول فكرتك إلى واقع رقمي مبهر. حلول برمجية مخصصة وتصميمات ووردبريس احترافية تناسب احتياجات مشروعك وتطلعاتك.
            </p>

            <div className="flex flex-wrap flex-row-reverse gap-4 justify-center md:justify-start">
              <button
                onClick={() => setActiveModal("web")}
                className="group relative inline-flex items-center justify-center px-6 py-3.5 font-bold text-[#010205] transition-all duration-300 bg-[#00f5ff] rounded-xl hover:shadow-[0_0_25px_rgba(0,245,255,0.6)] hover:-translate-y-1 active:scale-95 overflow-hidden cyber-corner text-sm sm:text-base"
              >
                <div className="absolute inset-0 w-0 bg-white transition-all duration-[300ms] ease-out group-hover:w-full opacity-20" />
                <span className="relative tracking-[0.1em] flex items-center gap-2">
                  برمجة موقع مخصص
                </span>
              </button>
              <button
                onClick={() => setActiveModal("wordpress")}
                className="group relative inline-flex items-center justify-center px-6 py-3.5 font-bold text-white transition-all duration-300 bg-[#a855f7]/10 border-2 border-[#a855f7] rounded-xl hover:bg-[#a855f7] hover:text-[#010205] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] hover:-translate-y-1 active:scale-95 overflow-hidden cyber-corner text-sm sm:text-base"
              >
                <div className="absolute inset-0 w-0 bg-white transition-all duration-[300ms] ease-out group-hover:w-full opacity-20" />
                <span className="relative tracking-[0.1em] flex items-center gap-2">
                  ووردبريس
                </span>
              </button>
            </div>
          </div>

          {/* Animated Logos for Web/WP */}
          <div className="w-full md:w-1/2 relative flex justify-center items-center h-[250px] sm:h-[350px] md:h-[450px] md:order-1">
            {/* Animated Rings */}
            <div className="absolute w-[200px] sm:w-[300px] md:w-[380px] h-[200px] sm:h-[300px] md:h-[380px] rounded-full border border-[#00f5ff]/20 animate-[spin_40s_linear_infinite] border-dashed" />
            <div className="absolute w-[150px] sm:w-[240px] md:w-[300px] h-[150px] sm:h-[240px] md:h-[300px] rounded-full border border-[#a855f7]/20 animate-[spin_25s_linear_infinite_reverse] border-dotted" />

            {/* Web Logo */}
            <div className="absolute z-20 flex justify-center items-center w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 -translate-x-14 sm:-translate-x-24 -translate-y-8 sm:-translate-y-16">
              <motion.div
                initial={{ opacity: 0, x: -80 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full h-full relative"
              >
                <div className="absolute inset-0 animate-[float_4s_ease-in-out_infinite] flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#00f5ff] blur-[40px] opacity-30 rounded-full scale-75" />
                  <Image
                    src="/web-logo.webp"
                    alt="Web Development"
                    width={1024}
                    height={1024}
                    sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 192px"
                    className="relative w-28 sm:w-36 md:w-48 h-auto object-contain drop-shadow-[0_0_20px_rgba(0,245,255,0.7)]"
                  />
                </div>
              </motion.div>
            </div>

            {/* WordPress Logo */}
            <div className="absolute z-10 flex justify-center items-center w-36 h-36 sm:w-48 sm:h-48 md:w-64 md:h-64 translate-x-12 sm:translate-x-24 translate-y-8 sm:translate-y-16">
              <motion.div
                initial={{ opacity: 0, x: 80 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full h-full relative"
              >
                <div className="absolute inset-0 animate-[float_5s_ease-in-out_infinite_reverse] flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#a855f7] blur-[40px] opacity-30 rounded-full scale-75" />
                  <Image
                    src="/cybernetic-wordpress-logo.webp"
                    alt="WordPress"
                    width={1024}
                    height={1024}
                    sizes="(max-width: 640px) 128px, (max-width: 768px) 176px, 240px"
                    className="relative w-32 sm:w-44 md:w-60 h-auto object-contain drop-shadow-[0_0_20px_rgba(168,85,247,0.7)]"
                  />
                </div>
              </motion.div>
            </div>
          </div>

        </div>
      </div>

      {/* Web Modal */}
      <DigitalServiceModal
        isOpen={activeModal === "web"}
        onClose={() => setActiveModal(null)}
        title="برمجة مواقع مخصصة"
        subtitle="أرسل طلبك الآن وسنتواصل معك فوراً"
        icon={<Code className="h-8 w-8" />}
        iconBgColor="rgba(0, 245, 255, 0.125)"
        iconColor="#00f5ff"
        projectTypes={['موقع كود احترافي (React/Next.js)', 'تطبيق ويب مخصص (Full-Stack)', 'لوحة تحكم (Dashboard)', 'برمجة متجر خاص متطور']}
        initialMessage="مرحباً، أريد الاستفسار عن خدمة برمجة وتطوير المواقع المخصصة (Custom Code)."
      />

      {/* WordPress Modal */}
      <DigitalServiceModal
        isOpen={activeModal === "wordpress"}
        onClose={() => setActiveModal(null)}
        title="خدمات ووردبريس"
        subtitle="أرسل طلبك الآن وسنتواصل معك فوراً"
        icon={<Monitor className="h-8 w-8" />}
        iconBgColor="rgba(168, 85, 247, 0.125)"
        iconColor="#a855f7"
        projectTypes={['متجر ووكومرس (WooCommerce)', 'موقع إخباري / مدونة', 'بورتفوليو شخصي', 'إصلاح وحماية مواقع ووردبريس']}
        initialMessage="مرحباً، أريد الاستفسار عن خدمة تطوير وإدارة مواقع ووردبريس."
      />
    </section>
  )
}
