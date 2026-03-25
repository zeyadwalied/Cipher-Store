"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload, CheckCircle, ArrowRight, ShieldAlert, Copy, ExternalLink, Loader2 } from "lucide-react"



export default function PaymentClient({ order }: { order: any }) {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoadingInitial(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !file) return alert("الرجاء إدخال رقم الهاتف ورفع صورة التحويل")
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("senderPhoneNumber", phone)
      formData.append("receiptImage", file)

      const res = await fetch(`/api/checkout/${order.id}/payment`, {
        method: "POST",
        body: formData
      })

      if (res.ok) {
        router.push(`/order-confirmation/${order.id}`)
      } else {
        const errText = await res.text()
        alert(`فشل رفع البيانات: ${res.status} - ${errText}`)
        setIsSubmitting(false)
      }
    } catch (err: any) {
      console.error(err)
      alert(`حدث خطأ أثناء الاتصال بالخادم: ${err.message}`)
      setIsSubmitting(false)
    }
  }

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 text-[#a855f7] animate-spin" />
          <div className="absolute inset-0 blur-xl bg-[#a855f7]/30 animate-pulse" />
        </div>
        <p className="text-gray-400 font-medium animate-pulse">جاري تجهيز بيانات الدفع...</p>
      </div>
    )
  }

  const method = order.paymentMethod?.toLowerCase() || 'vodafone'
  let paymentDetails = {
    title: "VODAFONE CASH",
    value: "01012345678",
    isLink: false,
    logo: <img src="/vodafone-logo.png" alt="Vodafone" className="h-30 w-auto object-contain drop-shadow-[0_0_15px_rgba(230,0,0,0.4)]" />,
    color: "#E60000"
  }

  if (method.includes('instapay')) {
    paymentDetails = {
      title: "InstaPay",
      value: "01094515731",
      isLink: false,
      logo: <img src="/instapay-logo.png" alt="InstaPay" className="h-30 w-auto object-contain drop-shadow-[0_0_15px_rgba(124,58,237,0.4)]" />,
      color: "#7C3AED"
    }
  } else if (method.includes('paypal')) {
    paymentDetails = {
      title: "PayPal",
      value: "https://www.paypal.com/paypalme/AL3KRB",
      isLink: true,
      logo: <img src="/paypal-logo.png" alt="PayPal" className="h-30 w-auto object-contain drop-shadow-[0_0_15px_rgba(0,156,222,0.4)]" />,
      color: "#009CDE"
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] py-12 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto bg-[#141417] border border-[#27272a] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#00f5ff] to-[#a855f7]" />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">تأكيد الدفع اليدوي</h1>
            <p className="text-gray-400">
              لقد اخترت الدفع عبر <strong className="text-white" style={{ color: paymentDetails.color }}>{paymentDetails.title}</strong>
            </p>
          </div>
          {paymentDetails.logo}
        </div>

        <div className="bg-[#09090b] border border-[#a855f7]/30 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-right">
            <div className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-1">المبلغ المطلوب تحويله</div>
            <div className="text-3xl font-bold text-[#00f5ff]">{order.total.toFixed(2)} EGP</div>
          </div>
          <div className="text-center md:text-left flex-1 max-w-xs">
            <div className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-1">
              {paymentDetails.isLink ? "رابط الدفع المباشر" : "رقم المحفظة / العنوان"}
            </div>
            <div className="relative group">
              <div className="text-lg font-mono text-white tracking-wider bg-[#27272a] px-4 py-3 rounded-xl break-all flex items-center justify-between gap-3">
                <span className="truncate">{paymentDetails.value}</span>
                <div className="flex gap-2 shrink-0">
                  {paymentDetails.isLink ? (
                    <a
                      href={paymentDetails.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-[#a855f7]/20 text-[#a855f7] rounded-lg hover:bg-[#a855f7]/30 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <button
                      onClick={() => handleCopy(paymentDetails.value)}
                      className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-500/20 text-green-500' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'}`}
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Note Box */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5 mb-8 flex gap-4 text-blue-400">
          <ShieldAlert className="w-8 h-8 shrink-0 text-blue-500" />
          <p className="text-sm leading-relaxed">
            <strong>ملاحظة هامة:</strong> رجاءً قم بأخذ صورة شاشة (Screenshot) لرسالة التحويل الناجحة لإثبات الدفع. سيتم مراجعة الطلب وتسليم المنتج فور التأكد من وصول المبلغ عبر فريق الدعم.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#a855f7]" /> الاسم أو الرقم المستخدم في التحويل
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="الاسم المسجل أو رقم الموبايل"
              className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-5 py-4 text-white focus:outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7]/50 transition-all font-mono text-right"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00f5ff]" /> ارفع صورة إثبات التحويل
            </label>

            <label className={`w-full h-44 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer transition-all hover:bg-[#1c1c21] ${file ? 'border-[#00ff41] bg-[#00ff41]/5' : 'border-[#27272a] hover:border-[#00f5ff]/50 bg-[#09090b]'}`}>
              {file ? (
                <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                    <CheckCircle className="w-8 h-8 text-[#00ff41]" />
                  </div>
                  <span className="text-[#00ff41] font-bold">تم إرفاق إثبات الدفع</span>
                  <span className="text-xs text-gray-500 mt-1">{file.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 rounded-2xl bg-[#141417] border border-[#27272a] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-gray-500" />
                  </div>
                  <span className="text-gray-400 font-medium">اضغط هنا لاختيار الصورة</span>
                  <span className="text-xs text-gray-600 mt-2">JPG, PNG, WEBP (Max 5MB)</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                required
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !phone || !file}
            className="w-full bg-gradient-to-r from-[#00f5ff] to-[#a855f7] hover:brightness-110 text-white font-bold py-5 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-xl shadow-[0_10px_30px_rgba(168,85,247,0.3)] mt-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                جاري المعالجة...
              </>
            ) : (
              <>
                تأكيد الدفع وإرسال الطلب
                <ArrowRight className="w-6 h-6 rotate-180" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
