import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft, Shield, Gamepad2, Star, Tag } from "lucide-react"
import { AddToCartButton } from "./add-to-cart-button"
import { calculateDiscount } from "@/lib/discountEngine"
import { ProductReviews } from "./product-reviews"
import type { Metadata } from "next"
import { getCachedProduct, getCachedDiscounts, getProductStockCount } from "@/lib/dal"
import { getSiteUrl } from "@/lib/site-url"

const siteUrl = getSiteUrl()
type ProductData = NonNullable<Awaited<ReturnType<typeof getCachedProduct>>>

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const product = await getCachedProduct(id)

  if (!product) {
    return { title: 'Product Not Found | Cipher Store' }
  }

  return {
    title: `${product.name} | Cipher Store`,
    description: product.description?.substring(0, 160) || `Buy ${product.name} at the best price on Cipher Store.`,
    alternates: {
      canonical: `/product/${product.slug || id}`
    },
    openGraph: {
      title: product.name,
      description: product.description?.substring(0, 160) || `Buy ${product.name} at the best price on Cipher Store.`,
      images: product.image ? [{ url: product.image }] : [],
      url: `${siteUrl}/product/${product.slug || id}`
    }
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Use cached DAL for product and related data
  let product = await getCachedProduct(id)

  // If not found in cached DB but it's a preview dummy product
  if (!product && id.startsWith('preview-prod-')) {
    const previewProduct: ProductData = {
      id,
      name: "Premium Gaming Item",
      price: parseFloat(id.split('-').pop() || "1") * 14.99,
      description: "This is a premium gaming product providing immediate delivery and safe execution. Your account safety is our priority. \n\nFeatures:\n- Instant Delivery\n- 24/7 Support\n- Global Region\n- Secure Transaction",
      image: null,
      categoryId: "dummy",
      deliveryType: "MANUAL",
      stockQuantity: null,
      sellerId: null,
      reviews: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    product = previewProduct
  }

  if (!product) {
    notFound()
  }

  const averageRating = product.reviews?.length
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
    : 5

  const activeDiscounts = await getCachedDiscounts()
  const { finalPrice, originalPrice, bestDiscount } = calculateDiscount(product, activeDiscounts)

  // Calculate actual available stock for AUTOMATIC delivery products
  if (product.deliveryType === "AUTOMATIC") {
    const availableStockCount = await getProductStockCount(product.id)
    if (product.stockQuantity === null || availableStockCount < product.stockQuantity) {
      product.stockQuantity = availableStockCount
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* JSON-LD Structured Data for Product */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.description,
            "image": product.image ? [product.image] : [],
            "offers": {
              "@type": "Offer",
              "price": finalPrice.toFixed(2),
              "priceCurrency": "EGP",
              "availability": product.stockQuantity === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
              "url": `${siteUrl}/product/${product.slug || product.id}`
            }
          })
        }}
      />
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8 transition-colors flex-row-reverse w-fit ml-auto">
        <ArrowLeft className="h-4 w-4 rotate-180" /> العودة للصفحة الرئيسية
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Image */}
        <div className="rounded-2xl border border-[#27272a] bg-[#141417] aspect-square flex items-center justify-center p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[#a855f7]/5 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
          <Image
            src={product.image || "/placeholder.png"}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="absolute inset-0 object-cover z-0"
          />
        </div>

        {/* Right Column: Details */}
        <div className="flex flex-col">
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">{product.name}</h1>

          {/* Rating Snapshot */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-yellow-500">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`h-4 w-4 ${i <= Math.round(averageRating) ? "fill-current" : "text-gray-600"}`} />
              ))}
            </div>
            <span className="text-sm text-gray-400">({product.reviews?.length || 0} تقييم)</span>
          </div>

          <div className="mb-6 flex items-end gap-3">
            {bestDiscount ? (
              <div className="flex flex-col">
                <span className="text-xl text-gray-500 line-through font-mono opacity-80 decoration-[#ff0055]/50 decoration-2">
                  {originalPrice.toFixed(2)} EGP
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-[#00f5ff] drop-shadow-[0_0_12px_rgba(0,245,255,0.6)]">
                    {finalPrice.toFixed(2)} <span className="text-xl">EGP</span>
                  </span>
                  <div className="relative group/badge">
                    <div
                      className="bg-[#ff0055] text-white font-black text-sm px-4 py-2 flex items-center gap-2 shadow-[0_0_20px_rgba(255,0,85,0.6)] border-white/20"
                      style={{
                        clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0 100%, 0 25%)"
                      }}
                    >
                      <Tag className="w-4 h-4 animate-bounce" />
                      <span className="animate-pulse">{bestDiscount.isPercentage ? `-${bestDiscount.value}%` : `-${bestDiscount.value} EGP`} خصم</span>
                    </div>
                    <div className="absolute inset-0 bg-[#ff0055] blur-xl opacity-20 -z-10" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-4xl font-bold text-[#a855f7] drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                {product.price.toFixed(2)} <span className="text-xl">EGP</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 mb-8 pb-8 border-b border-[#27272a]">
            {/* Trust Badges */}
            <div className="flex items-center gap-6 justify-start flex-row-reverse" dir="ltr">
              <div className="flex items-center gap-2 text-sm text-[#0ea5e9]">
                <Shield className="h-4 w-4" /> آمن ومضمون
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Gamepad2 className="h-4 w-4" /> تسليم فوري
              </div>
            </div>

            {/* Cyberpunk Stock Bar */}
            <div className="bg-[#09090b] border border-[#27272a] rounded-lg p-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#00f5ff]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <div className="flex justify-between items-end mb-2 relative z-10 flex-row-reverse">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <div className={`h-2 w-2 rounded-full animate-pulse ${product.stockQuantity === 0 ? 'bg-red-500' : 'bg-[#00ff41]'}`} />
                  <span className="text-sm font-mono text-gray-300 uppercase tracking-widest">حالة المخزون</span>
                </div>
                <div className={`text-lg font-bold font-cyber ${product.stockQuantity === 0 ? 'text-red-500 glitch' : 'text-[#00f5ff]'}`} data-text={product.stockQuantity === 0 ? "OUT_OF_STOCK" : undefined} dir="ltr">
                  {product.stockQuantity === null ? "غير محدود" : (product.stockQuantity === 0 ? "نفذت الكمية" : `${product.stockQuantity} متوفر`)}
                </div>
              </div>

              {/* Progress Bar Visual (only if limited stock) */}
              {product.stockQuantity !== null && (
                <div className="h-2 w-full bg-[#27272a] rounded-full overflow-hidden mt-1 relative">
                  <div
                    className={`absolute top-0 left-0 h-full transition-all duration-1000 ${product.stockQuantity > 10 ? "bg-[#00f5ff] shadow-[0_0_10px_#00f5ff]" :
                      product.stockQuantity > 0 ? "bg-orange-500 shadow-[0_0_10px_#f97316]" :
                        "bg-red-500 w-full"
                      }`}
                    style={{ width: product.stockQuantity === 0 ? "100%" : `${Math.min(100, (product.stockQuantity / 50) * 100)}%` }}
                  />
                  {/* Scanline effect over the bar */}
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] w-[200%] animate-scan" />
                </div>
              )}
            </div>
          </div>

          <div className="prose prose-invert border-b border-[#27272a] pb-8 mb-8 text-right">
            <h3 className="text-xl font-semibold mb-3">وصف المنتج</h3>
            <div className="text-gray-400 whitespace-pre-line text-sm leading-relaxed" dir="rtl">
              {product.description}
            </div>
          </div>

          {/* Add to Cart Client Component */}
          {product.stockQuantity === 0 ? (
            <button disabled className="w-full bg-red-900/30 text-red-500 border border-red-500/30 py-4 rounded-xl font-bold font-cyber tracking-widest cursor-not-allowed">
              نفذت الكمية
            </button>
          ) : (
            <AddToCartButton product={{
              id: product.id,
              name: product.name,
              price: finalPrice,
              image: product.image || undefined,
              stockQuantity: product.stockQuantity // pass stock to prevent over-adding
            }} />
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <ProductReviews productId={product.id} />
    </div>
  )
}
