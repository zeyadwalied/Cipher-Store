"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload, CheckCircle, ArrowRight, ShieldAlert, Copy, ExternalLink, Loader2 } from "lucide-react"
import { useCartStore } from "@/lib/store"

export default function PaymentClient({ order }: { order: any }) {
  const router = useRouter()
  const { clearCart } = useCartStore()
  const [phone, setPhone] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [copied, setCopied] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setLoadingInitial(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    setFile(selectedFile)
    setIsUploadingImage(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("key", process.env.NEXT_PUBLIC_IMGBB_API_KEY || "e1b9b1e2206bcfa7e8d7ea761bd0fb45")
      formData.append("image", selectedFile)

      const xhr = new XMLHttpRequest()
      xhr.open("POST", "https://api.imgbb.com/1/upload")

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percent)
        }
      }

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText))
            } catch {
              reject(new Error("Invalid response format"))
            }
          } else {
            console.error("ImgBB upload error response:", xhr.responseText)
            reject(new Error(`Failed to upload: ${xhr.statusText}`))
          }
        }
        xhr.onerror = () => reject(new Error("Network Error during image upload"))
        xhr.send(formData)
      })

      const result: any = await uploadPromise
      if (result?.data?.url) {
        setUploadedImageUrl(result.data.url)
      } else {
        throw new Error("Invalid response from image host")
      }
    } catch (err: any) {
      console.error("Upload error:", err)
      alert("فشل رفع الصورة، يرجى المحاولة مرة أخرى لاحقاً.")
      setFile(null)
    } finally {
      setIsUploadingImage(false)
      setUploadProgress(0)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !uploadedImageUrl) return alert("الرجاء إدخال رقم الهاتف وانتظار إكتمال رفع الصورة")
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/checkout/${order.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderPhoneNumber: phone, receiptImageUrl: uploadedImageUrl })
      })

      if (res.ok) {
        clearCart()
        router.push(`/order-confirmation/${order.id}`)
      } else {
        const text = await res.text()
        alert(`فشل إرسال الطلب: ${res.status} - ${text}`)
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
    value: "01094515731",
    isLink: false,
    logo: <img src="/vodafone-logo.png" alt="Vodafone" className="h-16 sm:h-24 w-auto object-contain drop-shadow-[0_0_15px_rgba(230,0,0,0.4)]" />,
    color: "#E60000"
  }

  if (method.includes('instapay')) {
    paymentDetails = {
      title: "InstaPay",
      value: "01094515731",
      isLink: false,
      logo: <img src="/instapay-logo.png" alt="InstaPay" className="h-16 sm:h-24 w-auto object-contain drop-shadow-[0_0_15px_rgba(124,58,237,0.4)]" />,
      color: "#7C3AED"
    }
  } else if (method.includes('paypal')) {
    paymentDetails = {
      title: "PayPal",
      value: "https://www.paypal.com/paypalme/AL3KRB",
      isLink: true,
      logo: <img src="/paypal-logo.png" alt="PayPal" className="h-16 sm:h-24 w-auto object-contain drop-shadow-[0_0_15px_rgba(0,156,222,0.4)]" />,
      color: "#009CDE"
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] py-6 sm:py-12 px-3 sm:px-4" dir="rtl">
      <div className="max-w-2xl mx-auto bg-[#141417] border border-[#27272a] rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#00f5ff] to-[#a855f7]" />

        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-black text-white mb-1 sm:mb-2">تأكيد الدفع اليدوي</h1>
            <p className="text-xs sm:text-base text-gray-400">
              لقد اخترت الدفع عبر <strong className="text-white" style={{ color: paymentDetails.color }}>{paymentDetails.title}</strong>
            </p>
          </div>
          <div className="shrink-0">{paymentDetails.logo}</div>
        </div>

        <div className="bg-[#09090b] border border-[#a855f7]/30 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="text-center md:text-right">
            <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-widest font-bold mb-1">المبلغ المطلوب تحويله</div>
            <div className="text-2xl sm:text-3xl font-bold text-[#00f5ff]">{order.total.toFixed(2)} EGP</div>
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

            <label className={`relative w-full h-44 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer transition-all hover:bg-[#1c1c21] overflow-hidden ${uploadedImageUrl ? 'border-transparent' : isUploadingImage ? 'border-[#00f5ff] bg-[#00f5ff]/5' : 'border-[#27272a] hover:border-[#00f5ff]/50 bg-[#09090b]'}`}>
              {uploadedImageUrl ? (
                <div className="flex flex-col items-center w-full h-full relative group">
                  <img src={uploadedImageUrl} alt="Receipt" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle className="w-10 h-10 text-[#00ff41] mb-2" />
                    <span className="text-white font-bold">تم إرفاق الإثبات بنجاح</span>
                    <span className="text-xs text-gray-300 mt-1">اضغط لاستبدال الصورة</span>
                  </div>
                </div>
              ) : isUploadingImage ? (
                <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                  <Loader2 className="w-10 h-10 text-[#00f5ff] animate-spin mb-3" />
                  <span className="text-[#00f5ff] font-bold">جاري رفع الصورة... {uploadProgress}%</span>
                  <div className="w-48 h-1 bg-gray-800 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#00f5ff] to-[#a855f7] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
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
                className="hidden"
                disabled={isUploadingImage}
                onChange={handleImageUpload}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isUploadingImage || !phone || !uploadedImageUrl}
            className="w-full bg-gradient-to-r from-[#00f5ff] to-[#a855f7] hover:brightness-110 text-white font-bold py-5 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-xl shadow-[0_10px_30px_rgba(168,85,247,0.3)] mt-8 relative overflow-hidden"
          >
            <div className="relative z-10 flex items-center gap-3">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  جاري التحقق والمعالجة...
                </>
              ) : isUploadingImage ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  يرجى الانتظار حتى اكتمال رفع الصورة...
                </>
              ) : (
                <>
                  تأكيد الدفع وإرسال الطلب
                  <ArrowRight className="w-6 h-6 rotate-180" />
                </>
              )}
            </div>
          </button>
        </form>
      </div>
    </div>
  )
}
