"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Gamepad2, ArrowRight, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlError = searchParams.get("error")
    if (urlError === "Blocked") {
      setError("تم حظر حسابك، يرجى التواصل مع الإدارة لمزيد من التفاصيل")
    } else if (urlError) {
      setError("خطأ في تسجيل الدخول - " + urlError)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      if (result.error.includes("not verified")) {
        router.push(`/verify?email=${encodeURIComponent(email)}`)
        return
      }
      
      if (result.error.includes("BLOCKED:")) {
        setError(result.error.split("BLOCKED:")[1])
        return
      }

      // If generic error, check if user is actually blocked
      if (result.error === "CredentialsSignin" || result.error === "Configuration") {
        try {
            const checkRes = await fetch(`/api/auth/check-block?email=${encodeURIComponent(email)}`)
            const checkData = await checkRes.json()
            if (checkData.isBlocked) {
                setError("تم حظر حسابك، يرجى التواصل مع المسؤول لمزيد من المعلومات")
                return
            }
        } catch (e) {
            console.error("Block check failed", e)
        }
        setError("خطأ في البريد الإلكتروني أو كلمة المرور")
      } else {
        setError(result.error)
      }
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-4 py-24 min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md bg-[#141417] border border-[#27272a] rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center justify-center mb-8">
          <img 
            src="/favicon.ico.png" 
            alt="Logo" 
            className="h-28 w-auto object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.7)] mb-8" 
          />
          <h1 className="text-2xl font-bold text-white">مرحباً بعودتك</h1>
          <p className="text-sm text-gray-400 mt-1">سجل الدخول لحسابك في Cipher Store</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1 text-right" htmlFor="email">البريد الإلكتروني</label>
            <input
              id="email"
              type="email"
              required
              className="w-full bg-[#09090b] border border-[#27272a] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] transition-all text-right"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1 flex-row-reverse">
              <label className="block text-sm font-medium text-gray-400" htmlFor="password">كلمة المرور</label>
              <Link href="/forgot-password" className="text-xs text-[#00f5ff] hover:underline">
                نسيت كلمة المرور؟
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-[#09090b] border border-[#27272a] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] transition-all pl-12 text-right"
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
            className="w-full bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] mt-6 flex items-center justify-center gap-2 flex-row-reverse"
          >
            تسجيل الدخول <ArrowRight className="h-4 w-4 rotate-180" />
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          ليس لديك حساب؟{" "}
          <Link href="/register" className="text-[#a855f7] font-semibold hover:underline border-b border-transparent hover:border-[#a855f7]">
            سجل مجاناً
          </Link>
        </p>
      </div>
    </div>
  )
}
