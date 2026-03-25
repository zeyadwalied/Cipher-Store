"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { KeyRound, ArrowRight, Mail, ShieldCheck, Lock, Loader2, Eye, EyeOff } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<"email" | "code" | "done">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })

      if (res.ok) {
        setStep("code")
      } else {
        const data = await res.json()
        setError(data.error || "Something went wrong")
      }
    } catch {
      setError("Network error, please try again")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match")
      return
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword })
      })

      const data = await res.json()

      if (res.ok) {
        setStep("done")
      } else {
        setError(data.error || "Invalid or expired code")
      }
    } catch {
      setError("Network error, please try again")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4 py-24 min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md bg-[#141417] border border-[#27272a] rounded-2xl p-8 shadow-xl">
        
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center border mb-4 ${
            step === "done" 
              ? "bg-green-500/10 border-green-500/20" 
              : "bg-[#00f5ff]/10 border-[#00f5ff]/20"
          }`}>
            {step === "email" && <KeyRound className="h-6 w-6 text-[#00f5ff]" />}
            {step === "code" && <ShieldCheck className="h-6 w-6 text-[#00f5ff]" />}
            {step === "done" && <Lock className="h-6 w-6 text-green-500" />}
          </div>
          <h1 className="text-2xl font-bold text-white">
            {step === "email" && "Forgot Password?"}
            {step === "code" && "Enter Verification Code"}
            {step === "done" && "Password Reset! ✅"}
          </h1>
          <p className="text-sm text-gray-400 mt-1 text-center">
            {step === "email" && "Enter your email to receive a verification code"}
            {step === "code" && `We sent a 6-digit code to ${email}`}
            {step === "done" && "Your password has been successfully changed"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {["email", "code", "done"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-2 w-8 rounded-full transition-all ${
                i <= ["email", "code", "done"].indexOf(step)
                  ? "bg-[#00f5ff]"
                  : "bg-[#27272a]"
              }`} />
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="reset-email">
                <Mail className="inline h-3.5 w-3.5 mr-1" /> Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                required
                placeholder="your@email.com"
                className="w-full bg-[#09090b] border border-[#27272a] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#00f5ff] focus:ring-1 focus:ring-[#00f5ff] transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#00f5ff] to-[#a855f7] hover:opacity-90 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(0,245,255,0.2)] mt-4 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send Code <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        )}

        {/* Step 2: Code + New Password */}
        {step === "code" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="reset-code">
                <ShieldCheck className="inline h-3.5 w-3.5 mr-1" /> Verification Code
              </label>
              <input
                id="reset-code"
                type="text"
                required
                maxLength={6}
                placeholder="000000"
                className="w-full bg-[#09090b] border border-[#27272a] rounded-xl py-3 px-4 text-white text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-[#00f5ff] focus:ring-1 focus:ring-[#00f5ff] transition-all"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <p className="text-xs text-gray-500 mt-1 text-center">Check your email inbox (and spam folder)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="new-password">
                <Lock className="inline h-3.5 w-3.5 mr-1" /> New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#00f5ff] focus:ring-1 focus:ring-[#00f5ff] transition-all pr-12"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1" htmlFor="confirm-password">
                <Lock className="inline h-3.5 w-3.5 mr-1" /> Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Type it again"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#00f5ff] focus:ring-1 focus:ring-[#00f5ff] transition-all pr-12"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full bg-gradient-to-r from-[#00f5ff] to-[#a855f7] hover:opacity-90 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(0,245,255,0.2)] mt-4 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Reset Password <ArrowRight className="h-4 w-4" /></>}
            </button>

            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); setError("") }}
              className="w-full text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
            >
              ← Back to email
            </button>
          </form>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-gray-400 mb-6">You can now sign in with your new password.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold px-6 py-3 rounded-xl transition-all"
            >
              Go to Sign In <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {step !== "done" && (
          <p className="mt-8 text-center text-sm text-gray-400">
            Remember your password?{" "}
            <Link href="/login" className="text-[#a855f7] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
