"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Trash, Plus, ShieldCheck, Key, Search, Loader2 } from "lucide-react"

export default function ProductStockPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [product, setProduct] = useState<any>(null)
  const [stock, setStock] = useState<any[]>([])
  const [newCode, setNewCode] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingStock, setIsAddingStock] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchStock = async () => {
    try {
      const res = await fetch(`/api/admin/products/${params.id}/stock`)
      if (res.ok) {
        const data = await res.json()
        setProduct(data.product)
        setStock(data.stock)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStock()
  }, [params.id])

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCode.trim() || isAddingStock) return

    setIsAddingStock(true)

    try {
      const res = await fetch(`/api/admin/products/${params.id}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: newCode })
      })

      if (res.ok) {
        setNewCode("")
        fetchStock()
      } else {
        alert("Failed to add stock.")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsAddingStock(false)
    }
  }

  const handleDeleteStock = async (item: any) => {
    const msg = item.isUsed 
      ? "WARNING: This code has already been sold/reserved! Deleting it removes it from our records. Are you absolutely sure?" 
      : "Are you sure you want to delete this unused code?"
    if (!confirm(msg)) return

    try {
      const res = await fetch(`/api/admin/products/${params.id}/stock?stockId=${item.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchStock()
      } else {
        alert("Failed to delete stock.")
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteAll = async () => {
    if (!stock.length) return
    if (!confirm("DANGER: Are you sure you want to delete ALL codes for this product? This action cannot be undone.")) return
    if (!confirm("Are you ABSOLUTELY sure? This will delete both unused and sold codes.")) return

    try {
      const res = await fetch(`/api/admin/products/${params.id}/stock?stockId=all`, {
        method: "DELETE",
      })

      if (res.ok) {
        setStock([])
        fetchStock()
      } else {
        alert("Failed to delete all stock.")
      }
    } catch (e) {
      console.error(e)
    }
  }

  const filteredStock = stock.filter(item => 
    item.data.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) return <div className="animate-pulse h-64 bg-[#141417] rounded-xl border border-[#27272a]"></div>

  if (!product) return <div className="text-white">Product not found.</div>

  const isSeller = session?.user?.role === "SELLER"
  if (isSeller && product.sellerId !== session?.user?.id) {
    return <div className="text-red-500">You do not have permission to manage this product's stock.</div>
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#27272a]">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Key className="h-8 w-8 text-[#a855f7]" /> Manage Stock
          </h1>
          <p className="text-gray-400 mt-2">
            Managing automatic delivery codes for <strong className="text-white">{product.name}</strong>
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="bg-[#27272a] hover:bg-[#3f3f46] text-white px-4 py-2 rounded-lg transition-colors text-sm"
        >
          Back to Products
        </button>
      </div>

      <div className="bg-[#141417] border border-[#27272a] rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Add New Code / Account</h2>
        <form onSubmit={handleAddStock} className="flex gap-4">
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="e.g. XXXX-XXXX-XXXX-XXXX or user:pass"
            className="flex-1 bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-[#a855f7]"
            required
          />
          <button
            type="submit"
            disabled={isAddingStock || !newCode.trim()}
            className="bg-[#a855f7] hover:bg-[#9333ea] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isAddingStock ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Add Code
              </>
            )}
          </button>
        </form>
      </div>

      <div className="bg-[#141417] border border-[#27272a] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-[#27272a] flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white">Current Inventory ({stock.length})</h2>
            <div className="text-sm text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded font-bold">
              <ShieldCheck className="h-4 w-4" /> Available: {stock.filter(s => !s.isUsed).length}
            </div>
            
            <div className="relative ml-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search codes..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#09090b] border border-[#27272a] rounded-lg py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-[#a855f7]"
              />
            </div>
          </div>
          {stock.length > 0 && (
            <button 
              onClick={handleDeleteAll}
              className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
            >
              <Trash className="h-3 w-3" /> Clear All Codes
            </button>
          )}
        </div>

        {stock.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No stock available yet. Add some codes above!
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#09090b] text-gray-400 text-sm border-b border-[#27272a]">
                <th className="p-4 font-medium">Secret Data</th>
                <th className="p-4 font-medium w-32">Status</th>
                <th className="p-4 font-medium w-40">Added On</th>
                <th className="p-4 font-medium w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                    {searchTerm ? `No codes matching "${searchTerm}"` : "No stock available yet. Add some codes above!"}
                  </td>
                </tr>
              ) : filteredStock.map((item) => (
                <tr key={item.id} className="border-b border-[#27272a] hover:bg-[#27272a]/30">
                  <td className="p-4">
                    <span className="font-mono text-gray-300 bg-[#09090b] px-2 py-1 rounded border border-[#27272a]">
                      {item.data}
                    </span>
                  </td>
                  <td className="p-4">
                    {item.isUsed ? (
                      <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs font-bold">SOLD / RESERVED</span>
                    ) : (
                      <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-bold">AVAILABLE</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteStock(item)}
                      className={`${item.isUsed ? 'text-red-500/50 hover:text-red-500' : 'text-gray-500 hover:text-red-500'} transition-colors p-2`}
                      title={item.isUsed ? "Delete sold code (Warning)" : "Delete unused code"}
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
