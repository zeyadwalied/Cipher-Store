"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Gamepad2, ArrowRight, Eye, EyeOff } from "lucide-react"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        // Redirect to verification page
        router.push(`/verify?email=${encodeURIComponent(email)}`)
      } else {
        setError(data.message || "حدث خطأ ما")
      }
    } catch (err) {
      setError("حدث خطأ أثناء التسجيل")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4 py-24 min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md bg-[#141417] border border-[#27272a] rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-[#0ea5e9]/10 flex items-center justify-center border border-[#0ea5e9]/20 mb-4">
            <img
              src="/favicon.ico.png"
              alt="Logo"
              className="h-8 w-8 object-contain drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">إنشاء حساب</h1>
          <p className="text-sm text-gray-400 mt-1">انضم إلى Cipher Store واستمتع بأفضل الألعاب</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1 text-right" htmlFor="name">اسم المستخدم</label>
            <input
              id="name"
              type="text"
              required
              className="w-full bg-[#09090b] border border-[#27272a] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all text-right"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1 text-right" htmlFor="email">البريد الإلكتروني</label>
            <input
              id="email"
              type="email"
              required
              className="w-full bg-[#09090b] border border-[#27272a] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all text-right"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1 text-right" htmlFor="password">كلمة المرور</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                className="w-full bg-[#09090b] border border-[#27272a] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all pl-12 text-right"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(14,165,233,0.2)] mt-6 flex items-center justify-center gap-2 flex-row-reverse"
          >
            {isLoading ? "جاري الإنشاء..." : "إنشاء الحساب"} <ArrowRight className="h-4 w-4 rotate-180" />
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="text-[#0ea5e9] font-semibold hover:underline border-b border-transparent hover:border-[#0ea5e9]">
            تسجيل الدخول بدلاً من ذلك
          </Link>
        </p>
      </div>
    </div>
  )
}
