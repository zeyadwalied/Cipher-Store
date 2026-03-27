"use client"

import { motion } from "framer-motion"

export function AnimatedPromoLogos() {
  return (
    <div className="w-full md:w-1/2 relative flex justify-center items-center h-[200px] sm:h-[300px] md:h-[400px] md:order-1 mt-6 md:mt-0">
      {/* Animated Rings */}
      <div className="absolute w-[180px] sm:w-[280px] md:w-[350px] h-[180px] sm:h-[280px] md:h-[350px] rounded-full border border-[#1DB954]/20 animate-[spin_40s_linear_infinite] border-dashed pointer-events-none" />
      <div className="absolute w-[130px] sm:w-[220px] md:w-[280px] h-[130px] sm:h-[220px] md:h-[280px] rounded-full border border-[#5865F2]/20 animate-[spin_25s_linear_infinite_reverse] border-dotted pointer-events-none" />

      {/* Spotify Logo (Slides in from Left) */}
      <div className="absolute z-20 flex justify-center items-center w-28 h-28 sm:w-32 sm:h-32 md:w-48 md:h-48 -translate-x-12 sm:-translate-x-20 -translate-y-6 sm:-translate-y-12">
        <motion.div
          className="w-full h-full relative"
          initial={{ opacity: 0, x: -80 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="absolute inset-0 animate-[float_4s_ease-in-out_infinite] flex items-center justify-center">
            <div className="absolute inset-0 bg-[#1DB954] blur-[30px] opacity-40 rounded-full scale-75 pointer-events-none" />
            <img src="/Cyberpunk-Spotify-logo.webp" className="relative w-24 sm:w-28 md:w-40 h-auto object-contain drop-shadow-[0_0_15px_rgba(29,185,84,0.6)]" alt="Spotify" />
          </div>
        </motion.div>
      </div>

      {/* Nitro Logo (Slides in from Right) */}
      <div className="absolute z-10 flex justify-center items-center w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 translate-x-10 sm:translate-x-20 translate-y-6 sm:translate-y-12">
        <motion.div
          className="w-full h-full relative"
          initial={{ opacity: 0, x: 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          <div className="absolute inset-0 animate-[float_5s_ease-in-out_infinite_reverse] flex items-center justify-center">
            <div className="absolute inset-0 bg-[#5865F2] blur-[30px] opacity-40 rounded-full scale-75 pointer-events-none" />
            <img src="/NITRO-LOGO.webp" className="relative w-28 sm:w-32 md:w-48 h-auto object-contain drop-shadow-[0_0_15px_rgba(88,101,242,0.6)]" alt="Discord Nitro" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
