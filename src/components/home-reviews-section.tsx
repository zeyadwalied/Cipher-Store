"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Loader2, MessageSquare, Star } from "lucide-react"

type ReviewItem = {
  id: string
  rating: number
  comment: string | null
  createdAt: string | Date
  user?: {
    name: string | null
    image: string | null
  } | null
  product?: {
    id: string
    name: string
  } | null
}

type EligibleProduct = {
  id: string
  name: string
}

export function HomeReviewsSection({ initialReviews }: { initialReviews: ReviewItem[] }) {
  const { data: session, status } = useSession()

  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews)
  const [isRefreshingReviews, setIsRefreshingReviews] = useState(false)

  const [eligibleProducts, setEligibleProducts] = useState<EligibleProduct[]>([])
  const [isLoadingEligible, setIsLoadingEligible] = useState(false)

  const [selectedProductId, setSelectedProductId] = useState("")
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const selectedProductName = useMemo(
    () => eligibleProducts.find((p) => p.id === selectedProductId)?.name || "",
    [eligibleProducts, selectedProductId]
  )

  const refreshReviews = useCallback(async () => {
    try {
      setIsRefreshingReviews(true)
      const res = await fetch("/api/reviews?limit=6&includeProduct=true", { cache: "no-store" })
      if (!res.ok) return
      const data = (await res.json()) as ReviewItem[]
      setReviews(data)
    } catch {
      // Keep previous reviews on network errors.
    } finally {
      setIsRefreshingReviews(false)
    }
  }, [])

  const refreshEligibleProducts = useCallback(async () => {
    if (status !== "authenticated") return

    try {
      setIsLoadingEligible(true)
      const res = await fetch("/api/reviews?eligible=true", { cache: "no-store" })
      if (!res.ok) return
      const data = (await res.json()) as EligibleProduct[]
      setEligibleProducts(data)

      if (data.length === 0) {
        setSelectedProductId("")
        return
      }

      setSelectedProductId((prev) => (data.some((p) => p.id === prev) ? prev : data[0].id))
    } finally {
      setIsLoadingEligible(false)
    }
  }, [status])

  useEffect(() => {
    void refreshReviews()
  }, [refreshReviews])

  useEffect(() => {
    if (status === "authenticated") {
      void refreshEligibleProducts()
      return
    }

    setEligibleProducts([])
    setSelectedProductId("")
  }, [refreshEligibleProducts, status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const trimmedComment = comment.trim()
    if (!selectedProductId) {
      setError("اختار المنتج اللي تحب تقيّمه أولاً.")
      return
    }
    if (!trimmedComment) {
      setError("اكتب تعليقك قبل إرسال التقييم.")
      return
    }

    try {
      setIsSubmitting(true)
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductId,
          rating,
          comment: trimmedComment
        })
      })

      if (!res.ok) {
        setError(await res.text())
        return
      }

      const newReview = (await res.json()) as ReviewItem
      setReviews((prev) => [newReview, ...prev.filter((r) => r.id !== newReview.id)].slice(0, 6))
      setComment("")
      setRating(5)
      setSuccess("تم إرسال تقييمك بنجاح. شكرًا على رأيك!")

      await refreshEligibleProducts()
    } catch {
      setError("حدث خطأ أثناء إرسال التقييم. حاول مرة ثانية.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-black font-cyber text-white" style={{ textShadow: "0 0 30px rgba(168,85,247,0.4)" }}>
          آراء عملائنا <span className="neon-purple">الأبطال</span>
        </h2>
        <div className="cyber-divider max-w-xs mx-auto mt-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-mono text-gray-400">
              {isRefreshingReviews ? ">> جاري تحديث التقييمات..." : `>> آخر ${reviews.length} تقييمات`}
            </p>
            <button
              type="button"
              onClick={() => void refreshReviews()}
              className="text-xs font-mono text-[#00f5ff] hover:text-[#7ff9ff] transition-colors"
            >
              تحديث
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
            {reviews.length > 0 ? reviews.map((review) => (
              <div key={review.id} className="cyber-card cyber-corner p-6 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 h-full w-0.5 bg-gradient-to-b from-transparent via-[#a855f7] to-transparent" />

                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`h-4 w-4 ${i <= review.rating ? "text-[#ffd700] fill-[#ffd700]" : "text-gray-700"}`} />
                  ))}
                </div>

                {review.product?.name ? (
                  <p className="text-[11px] font-mono text-[#00f5ff] mb-3">المنتج: {review.product.name}</p>
                ) : null}

                <p className="text-sm text-gray-300 font-mono mb-6 border-b border-[#a855f7]/20 pb-6 leading-relaxed flex-1">
                  &ldquo;{review.comment?.trim() || "تجربة ممتازة، أنصح بالمتجر."}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-none cyber-corner bg-gradient-to-tr from-[#a855f7] to-[#00f5ff] flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                    {review.user?.image
                      ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={review.user.image} alt="" width={40} height={40} className="h-full w-full object-cover" />
                      )
                      : (review.user?.name?.charAt(0) || "U")
                    }
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-cyber">{review.user?.name || "مستخدم مجهول"}</h4>
                    <p className="text-[10px] text-[#00ff41] font-mono uppercase tracking-wider">✓ مشتري موثّق</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="md:col-span-2 text-center text-gray-500 font-mono py-10">
                &gt;&gt; لا توجد تقييمات حتى الآن - كن أول من يقيم منتجاتنا
              </div>
            )}
          </div>
        </div>

        <div className="cyber-card cyber-corner p-6 text-right">
          <h3 className="text-white text-lg font-bold font-cyber flex items-center justify-end gap-2">
            <MessageSquare className="h-5 w-5 text-[#a855f7]" />
            أضف تقييمك
          </h3>

          {status === "loading" ? (
            <div className="mt-6 text-gray-400 font-mono text-sm flex items-center justify-end gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري التحقق من حسابك...
            </div>
          ) : status !== "authenticated" || !session?.user ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-400 font-mono">لازم تسجل دخول علشان تقدر تضيف تقييم.</p>
              <Link href="/login" className="inline-block bg-[#a855f7] hover:bg-[#9333ea] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
                تسجيل الدخول
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {error ? <p className="text-red-400 text-xs font-mono bg-red-500/10 p-2 rounded">{error}</p> : null}
              {success ? <p className="text-green-400 text-xs font-mono bg-green-500/10 p-2 rounded">{success}</p> : null}

              <div>
                <label className="block text-xs text-gray-400 mb-2 font-mono">المنتج</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  disabled={isLoadingEligible || eligibleProducts.length === 0}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#a855f7] disabled:opacity-60"
                >
                  {eligibleProducts.length === 0 ? (
                    <option value="">
                      {isLoadingEligible ? "جاري تحميل المنتجات..." : "لا يوجد منتجات متاحة للتقييم حالياً"}
                    </option>
                  ) : (
                    eligibleProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2 font-mono">عدد النجوم</label>
                <div className="flex flex-row-reverse justify-end gap-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setRating(i)}
                      className="focus:outline-none"
                      aria-label={`Rate ${i} stars`}
                    >
                      <Star className={`h-7 w-7 transition-colors ${i <= rating ? "text-[#ffd700] fill-[#ffd700]" : "text-gray-600 hover:text-[#ffd700]/70"}`} />
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 mt-1 font-mono">
                  {selectedProductName ? `التقييم الحالي: ${rating}/5 - ${selectedProductName}` : `التقييم الحالي: ${rating}/5`}
                </p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2 font-mono">تعليقك</label>
                <textarea
                  rows={4}
                  maxLength={1200}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="اكتب تجربتك مع المنتج..."
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#a855f7]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || eligibleProducts.length === 0}
                className="w-full bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "جاري الإرسال..." : "إرسال التقييم"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
