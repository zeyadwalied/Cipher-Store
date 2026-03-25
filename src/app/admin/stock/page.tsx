import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { Database, Key, ShieldCheck, Activity } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminStockPage() {
  const session = await auth()
  if (!session || !["OWNER", "MANAGER", "SELLER"].includes(session.user.role)) {
    redirect("/")
  }

  // Fetch products with AUTOMATIC delivery
  const products = await prisma.product.findMany({
    where: {
      deliveryType: "AUTOMATIC",
      ...(session.user.role === "SELLER" ? { sellerId: session.user.id } : {})
    },
    include: {
      category: true,
      stockItems: true
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="h-8 w-8 text-[#00f5ff]" />
            Code Storage
          </h1>
          <p className="text-gray-400 mt-2">
            Overview of all your automatic delivery products and their code inventory.
          </p>
        </div>
      </div>

      <div className="bg-[#141417] border border-[#27272a] rounded-xl overflow-hidden box-glow-cyan">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#09090b] border-b border-[#27272a]">
            <tr className="text-gray-400 text-sm">
              <th className="px-6 py-4 font-medium">Product Name</th>
              <th className="px-6 py-4 font-medium">Category</th>
              <th className="px-6 py-4 font-medium text-center">Available Codes</th>
              <th className="px-6 py-4 font-medium text-center">Sold/Used</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No automatic delivery products found.
                </td>
              </tr>
            ) : products.map((product) => {
              const available = product.stockItems.filter(s => !s.isUsed).length
              const used = product.stockItems.filter(s => s.isUsed).length
              const isLowStock = available < 5
              const isOutOfStock = available === 0

              return (
                <tr key={product.id} className="border-b border-[#27272a] hover:bg-[#27272a]/20">
                  <td className="px-6 py-4 text-white font-bold">{product.name}</td>
                  <td className="px-6 py-4 text-gray-400">{product.category.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-lg font-mono font-bold ${isOutOfStock ? "text-red-500" : isLowStock ? "text-orange-500" : "text-[#00ff41]"}`}>
                      {available}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500 font-mono">
                    {used}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {isOutOfStock ? (
                      <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">OUT OF STOCK</span>
                    ) : isLowStock ? (
                      <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">LOW STOCK</span>
                    ) : (
                      <span className="bg-[#00f5ff]/10 text-[#00f5ff] border border-[#00f5ff]/20 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">HEALTHY</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/products/${product.id}/stock`}
                      className="inline-flex items-center gap-2 bg-[#00f5ff]/10 hover:bg-[#00f5ff]/20 text-[#00f5ff] border border-[#00f5ff]/30 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-[0_0_10px_rgba(0,245,255,0.1)] hover:shadow-[0_0_15px_rgba(0,245,255,0.3)]"
                    >
                      <Key className="h-4 w-4" /> Manage Codes
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
