"use client"

import { useState, useEffect } from "react"
import { Star, MessageSquare } from "lucide-react"

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`)
      if (res.ok) setReviews(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment })
      })

      if (res.ok) {
        setComment("")
        fetchReviews()
      } else {
        const text = await res.text()
        setError(text)
      }
    } catch (e) {
      setError("An error occurred while submitting your review.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div className="animate-pulse h-32 bg-[#141417] rounded-xl border border-[#27272a]"></div>

  const avgRating = reviews.length > 0
    ? reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length
    : 0

  return (
    <div className="mt-16 border-t border-[#27272a] pt-12">
      <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2 flex-row-reverse w-fit ml-auto">
        <MessageSquare className="h-6 w-6 text-[#a855f7]" /> تقييمات العملاء
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Stats */}
        <div className="bg-[#141417] border border-[#27272a] rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <div className="text-5xl font-black text-white mb-2">{avgRating.toFixed(1)}</div>
          <div className="flex text-yellow-500 mb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`h-5 w-5 ${i <= Math.round(avgRating) ? "fill-current" : "text-gray-600"}`} />
            ))}
          </div>
          <p className="text-gray-400 text-sm">بناءً على {reviews.length} تقييم</p>
        </div>

        {/* Form */}
        <div className="md:col-span-2 bg-[#141417] border border-[#27272a] rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 text-right">اكتب تقييماً</h3>
          {error && <div className="text-red-500 text-sm mb-4 bg-red-500/10 p-3 rounded-lg">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2 text-right">التقييم</label>
              <div className="flex gap-2 flex-row-reverse justify-end">
                {[1, 2, 3, 4, 5].map(i => (
                  <button type="button" key={i} onClick={() => setRating(i)} className="focus:outline-none">
                    <Star className={`h-8 w-8 transition-colors ${i <= rating ? "text-yellow-500 fill-current" : "text-gray-600 hover:text-yellow-500/50"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 text-right">تجربتك</label>
              <textarea
                required
                rows={3}
                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-white focus:outline-none focus:border-[#a855f7] text-right"
                placeholder="أخبر الآخرين برأيك عن هذا المنتج..."
                dir="rtl"
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "جاري الإرسال..." : "إرسال التقييم"}
            </button>
          </form>
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">لا توجد تقييمات حتى الآن. كن أول من يشارك رأيه!</p>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="bg-[#141417] border border-[#27272a] rounded-xl p-6">
              <div className="flex justify-between items-start mb-4 flex-row-reverse">
                <div className="flex items-center gap-3 flex-row-reverse">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#a855f7] to-[#0ea5e9] flex items-center justify-center text-white font-bold overflow-hidden">
                    {review.user?.image ? (
                      <img src={review.user.image} alt={review.user.name} className="h-full w-full object-cover" />
                    ) : (
                      review.user?.name?.charAt(0) || "U"
                    )}
                  </div>
                  <div>
                    <div className="text-white font-medium">{review.user?.name || "Unknown User"}</div>
                    <div className="flex text-yellow-500 mt-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`h-3 w-3 ${i <= review.rating ? "fill-current" : "text-gray-600"}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
              <p className="text-gray-300 whitespace-pre-line text-sm leading-relaxed">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
