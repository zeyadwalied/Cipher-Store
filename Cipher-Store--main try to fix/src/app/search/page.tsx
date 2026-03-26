import prisma from "@/lib/prisma"
import Link from "next/link"
import { Search as SearchIcon, Filter, Star, Tag, ShoppingCart } from "lucide-react"
import { AddToCartButton } from "@/app/product/[id]/add-to-cart-button"
import { calculateDiscount } from "@/lib/discountEngine"

export const dynamic = "force-dynamic"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoryId?: string; minPrice?: string; maxPrice?: string }>
}) {
  const params = await searchParams
  const q = params.q || ""
  const categoryId = params.categoryId || ""
  const minPrice = params.minPrice ? parseFloat(params.minPrice) : undefined
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : undefined

  // Build where clause based on filters
  let whereClause: any = {}

  if (q) {
    whereClause.OR = [
      { name: { contains: q } },
      { description: { contains: q } }
    ]
  }

  if (categoryId) {
    whereClause.categoryId = categoryId
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    whereClause.price = {}
    if (minPrice !== undefined) whereClause.price.gte = minPrice
    if (maxPrice !== undefined) whereClause.price.lte = maxPrice
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      category: true,
      reviews: { select: { rating: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  const categories = await prisma.category.findMany()
  const activeDiscounts = await (prisma as any).discount.findMany({ where: { isActive: true } })

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-8 min-h-[70vh]">

      {/* Sidebar Filters */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-[#141417] border border-[#27272a] rounded-xl p-6 sticky top-24">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Filter className="h-5 w-5 text-[#a855f7]" /> Filters
          </h2>

          <form method="GET" action="/search" className="space-y-6">
            {/* Search Input hidden but preserved for form submission if filtering */}
            <input type="hidden" name="q" value={q} />

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Category</label>
              <select
                name="categoryId"
                defaultValue={categoryId}
                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#a855f7]"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Price Range (EGP)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="minPrice"
                  placeholder="Min"
                  defaultValue={minPrice}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#a855f7]"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  name="maxPrice"
                  placeholder="Max"
                  defaultValue={maxPrice}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#a855f7]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-white/5 hover:bg-white/10 text-white border border-[#27272a] font-medium py-2 rounded-lg transition-colors text-sm"
            >
              Apply Filters
            </button>

            {(q || categoryId || minPrice || maxPrice) && (
              <Link href="/search" className="block text-center w-full text-red-400 hover:text-red-300 text-sm mt-2">
                Clear All
              </Link>
            )}
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {q ? `Search results for "${q}"` : "Browse Store"}
          </h1>
          <p className="text-gray-400">Found {products.length} products</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-[#141417] border border-[#27272a] rounded-xl flex flex-col items-center">
            <SearchIcon className="h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
            <p className="text-gray-400">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const avgRating = product.reviews.length > 0
                ? product.reviews.reduce((a, b) => a + b.rating, 0) / product.reviews.length
                : 5; // default 5 for aesthetic 

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.slug || product.id}`}
                  className="group relative rounded-xl border border-[#27272a] bg-[#141417] overflow-hidden transition-all hover:border-[#a855f7]/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] flex flex-col"
                >
                  <div className="aspect-[4/3] w-full bg-[#09090b] relative flex items-center justify-center border-b border-[#27272a] overflow-hidden">
                    <img
                      src={product.image || "/placeholder.png"}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute top-3 right-3 z-10 bg-[#09090b]/80 border border-[#27272a] px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-md">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-white font-bold">{avgRating.toFixed(1)}</span>
                    </div>

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
                  <div className="p-5 flex flex-col flex-1">
                    <div className="text-xs text-[#a855f7] font-medium mb-1">{product.category.name}</div>
                    <h3 className="text-white font-bold text-lg leading-tight group-hover:text-[#a855f7] transition-colors line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mt-2 flex-1">{product.description}</p>
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#27272a]/50">
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
                      <div className="h-10 px-4 rounded-lg bg-[#27272a] group-hover:bg-[#a855f7] transition-colors flex items-center justify-center text-white text-sm font-bold">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
