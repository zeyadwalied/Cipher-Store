"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ShieldCheck, RefreshCw } from "lucide-react"

export default function VerifyPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""

  useEffect(() => {
    if (!email) {
      router.push("/register")
    }
  }, [email, router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) {
      setCode(pasted.split(""))
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const fullCode = code.join("")
    if (fullCode.length !== 6) {
      setError("Please enter the full 6-digit code")
      return
    }

    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess("Email verified successfully! Redirecting to login...")
        setTimeout(() => {
          router.push("/login?verified=true")
        }, 2000)
      } else {
        setError(data.message || "Verification failed")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setIsResending(true)
    setError("")

    try {
      const res = await fetch("/api/auth/verify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess("New code sent! Check your email.")
        setCountdown(60)
        setCode(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
      } else {
        setError(data.message || "Failed to resend")
      }
    } catch {
      setError("Failed to resend code")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4 py-24 min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md bg-[#141417] border border-[#27272a] rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center justify-center mb-8">
          <img 
            src="/favicon.ico.png" 
            alt="Logo" 
            className="h-32 w-auto object-contain drop-shadow-[0_0_15px_rgba(0,245,255,0.7)] mb-8" 
          />
          <h1 className="text-2xl font-bold text-white">Verify Your Email</h1>
          <p className="text-sm text-gray-400 mt-2 text-center">
            We sent a 6-digit code to{" "}
            <span className="text-[#00f5ff] font-medium">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium text-center">
            {success}
          </div>
        )}

        {/* Code Input */}
        <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-bold bg-[#09090b] border border-[#27272a] rounded-xl text-white focus:outline-none focus:border-[#00f5ff] focus:ring-1 focus:ring-[#00f5ff] focus:shadow-[0_0_10px_rgba(0,245,255,0.15)] transition-all"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={isLoading || code.join("").length !== 6}
          className="w-full bg-gradient-to-r from-[#00f5ff] to-[#a855f7] hover:opacity-90 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(0,245,255,0.2)] flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="h-5 w-5" />
              Verify Account
            </>
          )}
        </button>

        {/* Resend */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Didn't receive the code?{" "}
            <button
              onClick={handleResend}
              disabled={isResending || countdown > 0}
              className="text-[#00f5ff] font-semibold hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : isResending ? "Sending..." : "Resend Code"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
