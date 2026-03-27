import Link from "next/link"
import { Gamepad2, ArrowLeft, ShoppingCart } from "lucide-react"
import { calculateDiscount } from "@/lib/discountEngine"
import type { Metadata } from "next"
import { getCachedCategoryPageData } from "@/lib/category-page"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const categoryData = await getCachedCategoryPageData(slug)
  const category = categoryData?.category

  if (!category) {
    return { title: 'Category Not Found | Cipher Store' }
  }

  return {
    title: `${category.name} | Cipher Store`,
    description: `Browse our premium selection of ${category.name} products at the best prices on Cipher Store.`,
    openGraph: {
      title: `${category.name} | Cipher Store`,
      description: `Browse our premium selection of ${category.name} products at the best prices on Cipher Store.`,
    }
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const categoryData = await getCachedCategoryPageData(slug)
  const category = categoryData?.category
  const products = categoryData?.products || []
  const activeDiscounts = categoryData?.activeDiscounts || []
  const title = category?.name || "Category Not Found"

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* JSON-LD Structured Data for Category */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": title,
            "description": `Browse our selection of premium ${title.toLowerCase()} products.`,
            "url": typeof window !== 'undefined' ? window.location.href : `https://cipher-store.com/category/${category?.slug || category?.id}`,
            "hasPart": products.map((product: any) => ({
              "@type": "Product",
              "name": product.name,
              "url": `https://cipher-store.com/product/${product.slug || product.id}`
            }))
          })
        }}
      />
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-8 transition-colors flex-row-reverse w-fit ml-auto">
        <ArrowLeft className="h-4 w-4 rotate-180" /> عودة
      </Link>

      <div className="mb-12 border-b border-[#27272a] pb-8 text-right">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">{title}</h1>
        <p className="text-gray-400">تصفح تشكيلتنا المميزة من منتجات {title}</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24 border border-[#27272a] rounded-xl bg-[#141417]">
          <Gamepad2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">لا توجد منتجات</h3>
          <p className="text-gray-400">لا توجد منتجات في هذا القسم حالياً، يرجى العودة لاحقاً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug || product.id}`}
              className="group flex flex-col rounded-xl border border-[#27272a] bg-[#141417] overflow-hidden transition-all hover:border-[#a855f7]/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]"
            >
              <div className="aspect-[4/3] w-full bg-[#09090b] relative border-b border-[#27272a] overflow-hidden">
                <img
                  className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                />

                {/* Cyberpunk Discount Badge Overlay */}
                {(() => {
                  const { bestDiscount } = calculateDiscount(product, activeDiscounts)
                  if (!bestDiscount) return null
                  return (
                    <div className="absolute top-0 right-0 z-20">
                      <div className="relative group/badge">
                        <div
                          className="bg-[#ff0055] text-white font-black text-[10px] sm:text-[12px] px-3 py-1.5 flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,0,85,0.5)] border-b-2 border-l-2 border-white/20 transition-all duration-300"
                          style={{
                            clipPath: "polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 40%)"
                          }}
                        >
                          <span className="animate-pulse">{bestDiscount.isPercentage ? `-${bestDiscount.value}%` : `-${bestDiscount.value} EGP`}</span>
                        </div>
                        <div className="absolute inset-0 bg-[#ff0055] blur-xl opacity-20 -z-10" />
                      </div>
                    </div>
                  )
                })()}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-2 truncate group-hover:text-[#a855f7] transition-colors">{product.name}</h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">{product.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  {(() => {
                    const { finalPrice, originalPrice, bestDiscount } = calculateDiscount(product, activeDiscounts)
                    return bestDiscount ? (
                      <div className="flex flex-col">
                        <span className="text-[10px] sm:text-[12px] text-gray-500 line-through font-mono opacity-80 decoration-[#ff0055]/50 decoration-2">
                          {originalPrice.toFixed(2)} EGP
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-[#00f5ff] drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]">{finalPrice.toFixed(2)} EGP</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xl font-bold text-white">{product.price.toFixed(2)} EGP</span>
                    )
                  })()}
                  <div className="text-xs font-medium bg-[#a855f7] text-white p-2.5 rounded-lg flex items-center justify-center group-hover:bg-[#9333ea]">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
