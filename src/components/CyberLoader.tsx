"use client"

import { useState, useEffect } from "react"

export function CyberLoader() {
  // Start hidden, let useEffect decide visibility (avoids hydration mismatch)
  const [isVisible, setIsVisible] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Check sessionStorage — cleared when browser is fully closed
    const alreadyShown = sessionStorage.getItem("cipher_loader_shown")
    if (alreadyShown) return

    // Show the loader
    setIsVisible(true)
    document.body.style.overflow = "hidden"

    // Mark as shown for this browser session
    sessionStorage.setItem("cipher_loader_shown", "1")

    // Start fade-out
    const timer = setTimeout(() => {
      setFadeOut(true)
    }, 1200)

    // Remove from DOM and unlock scroll
    const removeTimer = setTimeout(() => {
      setIsVisible(false)
      document.body.style.overflow = ""
    }, 1800)

    return () => {
      clearTimeout(timer)
      clearTimeout(removeTimer)
      document.body.style.overflow = ""
    }
  }, [])

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#010205] transition-opacity duration-500 ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
    >
      {/* Scanlines overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,245,255,0.02)_50%)] bg-[length:100%_4px] pointer-events-none" />

      {/* Cyber grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0,245,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,245,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Corner accents */}
      <div className="absolute top-6 left-6 w-10 h-10 border-t-2 border-l-2 border-[#00f5ff]/60 animate-pulse" />
      <div className="absolute top-6 right-6 w-10 h-10 border-t-2 border-r-2 border-[#a855f7]/60 animate-pulse" />
      <div className="absolute bottom-6 left-6 w-10 h-10 border-b-2 border-l-2 border-[#a855f7]/60 animate-pulse" />
      <div className="absolute bottom-6 right-6 w-10 h-10 border-b-2 border-r-2 border-[#00f5ff]/60 animate-pulse" />

      {/* Ambient glows */}
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-[#00f5ff]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-[#a855f7]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Logo */}
      <div className="relative mb-8 text-center flex flex-col items-center">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-32 h-32 bg-[#00f5ff]/10 blur-[50px] animate-pulse mx-auto" />
        <img
          src="/logo.gif"
          alt="Cipher Store"
          className="relative w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_0_20px_rgba(0,245,255,0.5)]"
        />
      </div>

      {/* Loading bar */}
      <div className="w-56 sm:w-72 h-[3px] bg-[#0a0a1a] rounded-full overflow-hidden border border-[#00f5ff]/10 mb-5 relative">
        <div
          className="h-full rounded-full animate-[cyberLoad_1.5s_ease-in-out_forwards]"
          style={{
            background: 'linear-gradient(90deg, #00f5ff, #a855f7, #00f5ff)',
            boxShadow: '0 0 15px rgba(0,245,255,0.6), 0 0 30px rgba(168,85,247,0.4)'
          }}
        />
      </div>

      {/* Status text */}
      <div className="flex items-center gap-3 text-[#00f5ff] text-[10px] sm:text-xs font-mono tracking-[0.4em] uppercase font-bold" dir="rtl">
        <span className="w-2 h-2 rounded-full bg-[#00f5ff] animate-pulse shadow-[0_0_10px_#00f5ff]" />
        جاري تهيئة النظام
        <span className="animate-pulse">...</span>
      </div>

      {/* Style for the loading bar animation */}
      <style jsx>{`
        @keyframes cyberLoad {
          0% { width: 0%; }
          30% { width: 40%; }
          60% { width: 75%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  )
}
