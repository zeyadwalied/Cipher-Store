"use client"

import { useState, useEffect } from "react"
import { Plus, Trash, Edit, Package, ImageIcon, Key } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import MediaPickerModal from "@/components/media-picker-modal"

type Product = {
  id: string
  name: string
  price: number
  description: string
  image: string | null
  category: { id: string, name: string }
  deliveryType: string
  stockQuantity: number | null
}

type Category = {
  id: string
  name: string
  description: string | null
  isAutomaticOnly: boolean
  parentId?: string | null
}

export default function AdminProductsClient({
  initialProducts,
  initialCategories,
}: {
  initialProducts: Product[]
  initialCategories: Category[]
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0 && initialCategories.length === 0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMediaOpen, setIsMediaOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
    categoryId: "",
    deliveryType: "MANUAL",
    stockQuantity: ""
  })

  const router = useRouter()

  useEffect(() => {
    if (initialProducts.length === 0 && initialCategories.length === 0) {
      fetchData()
    }
  }, [initialProducts.length, initialCategories.length])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/products")
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products)
        setCategories(data.categories)
        if (data.categories.length > 0 && !formData.categoryId) {
          setFormData(prev => ({ ...prev, categoryId: data.categories[0].id }))
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const isEditing = !!editingId
      const finalDeliveryType = selectedCategoryForcesAuto ? "AUTOMATIC" : formData.deliveryType

      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image: formData.image,
        categoryId: formData.categoryId,
        deliveryType: finalDeliveryType,
        stockQuantity: formData.stockQuantity === "" ? null : formData.stockQuantity
      }
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { ...payload, id: editingId } : payload)
      })
      if (res.ok) {
        const productData = await res.json()
        setIsModalOpen(false)
        setEditingId(null)
        setFormData({ name: "", price: "", description: "", image: "", categoryId: categories[0]?.id || "", deliveryType: "MANUAL", stockQuantity: "" })
        fetchData()

        // Auto-redirect to Code Storage if it's a new automatic delivery product
        if (!isEditing && payload.deliveryType === "AUTOMATIC" && productData.id) {
          router.push(`/admin/products/${productData.id}/stock`)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" })
      if (res.ok) fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleEditClick = (product: Product) => {
    setEditingId(product.id)
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      image: product.image || "",
      categoryId: product.category?.id || categories[0]?.id || "",
      deliveryType: product.deliveryType,
      stockQuantity: product.stockQuantity !== null ? product.stockQuantity.toString() : ""
    })
    setIsModalOpen(true)
  }

  const openNewProductModal = () => {
    setEditingId(null)
    setFormData({ name: "", price: "", description: "", image: "", categoryId: categories[0]?.id || "", deliveryType: "MANUAL", stockQuantity: "" })
    setIsModalOpen(true)
  }

  // Handle category change to auto-update deliveryType if required
  const handleCategoryChange = (catId: string) => {
    const selectedCategory = categories.find(c => c.id === catId)
    if (selectedCategory?.isAutomaticOnly) {
      setFormData(prev => ({ ...prev, categoryId: catId, deliveryType: "AUTOMATIC" }))
    } else {
      setFormData(prev => ({ ...prev, categoryId: catId }))
    }
  }

  // Derive if currently selected category forces automatic delivery
  const selectedCategoryForcesAuto = categories.find(c => c.id === formData.categoryId)?.isAutomaticOnly || false

  useEffect(() => {
    if (selectedCategoryForcesAuto && formData.deliveryType !== "AUTOMATIC") {
      setFormData(prev => ({ ...prev, deliveryType: "AUTOMATIC" }))
    }
  }, [selectedCategoryForcesAuto, formData.deliveryType])

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Manage Products</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 rotate-45" /> {/* Using Plus rotated as a search icon fallback or just import Search */}
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#141417] border border-[#27272a] rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[#a855f7]"
            />
          </div>
          <button 
            onClick={openNewProductModal}
            className="bg-[#a855f7] hover:bg-[#9333ea] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" /> Add New Product
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading products...</div>
      ) : (
        <div className="bg-[#141417] border border-[#27272a] rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#09090b] border-b border-[#27272a]">
              <tr className="text-gray-400 text-sm">
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium text-center">SKU Stock</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? `No products matching "${searchTerm}"` : "No products found. Create one above!"}
                  </td>
                </tr>
              ) : filteredProducts.map(product => (
                <tr key={product.id} className="border-b border-[#27272a] hover:bg-[#27272a]/20">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="h-10 w-10 bg-[#09090b] border border-[#27272a] rounded overflow-hidden flex items-center justify-center">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <Plus className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">{product.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">{product.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-[#27272a] text-gray-300 px-2 py-1 rounded text-xs">
                      {product.category?.name || "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white font-bold">{product.price.toFixed(2)} EGP</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${product.deliveryType === 'AUTOMATIC' ? 'bg-[#0ea5e9]/10 text-[#0ea5e9]' : 'bg-gray-500/10 text-gray-400'}`}>
                      {product.deliveryType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${product.stockQuantity === null ? 'bg-green-500/10 text-green-500' : (product.stockQuantity > 0 ? 'bg-[#00f5ff]/10 text-[#00f5ff]' : 'bg-red-500/10 text-red-500')}`}>
                      {product.stockQuantity === null ? '∞' : product.stockQuantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {product.deliveryType === "AUTOMATIC" && (
                      <Link
                        href={`/admin/products/${product.id}/stock`}
                        className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors inline-block"
                        title="Manage Stock"
                      >
                        <Package className="h-4 w-4" />
                      </Link>
                    )}
                    <button onClick={() => handleEditClick(product)} className="text-gray-400 hover:text-white p-1.5 bg-[#09090b] rounded-lg border border-[#27272a] transition-colors inline-block">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-white hover:bg-red-500 p-1.5 bg-[#09090b] rounded-lg border border-[#27272a] transition-colors inline-block">
                      <Trash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141417] border border-[#27272a] rounded-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#27272a] flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{editingId ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Product Name</label>
                <input required type="text" className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-white focus:outline-none focus:border-[#a855f7]" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">Price (EGP)</label>
                  <input required type="number" step="0.01" className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-white focus:outline-none focus:border-[#a855f7]" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a855f7] appearance-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c: any) => {
                      const parent = categories.find(p => p.id === c.parentId)
                      const label = parent ? `${parent.name} > ${c.name}` : c.name
                      return (
                        <option key={c.id} value={c.id}>
                          {label}
                        </option>
                      )
                    })}
                    {categories.length === 0 && <option value="">No categories (will auto-create)</option>}
                  </select>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-400">Delivery Type</label>
                  {formData.deliveryType === 'AUTOMATIC' && (
                    editingId ? (
                      <Link
                        href={`/admin/products/${editingId}/stock`}
                        className="bg-[#00f5ff]/10 hover:bg-[#00f5ff]/20 text-[#00f5ff] border border-[#00f5ff]/30 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(0,245,255,0.1)] hover:shadow-[0_0_15px_rgba(0,245,255,0.3)]"
                      >
                        <Key className="h-3 w-3" /> Manage Code Storage
                      </Link>
                    ) : (
                      <span className="text-xs text-orange-400 border border-orange-400/30 bg-orange-400/10 px-3 py-1 rounded font-bold">
                        Will be redirected to Code Storage after saving
                      </span>
                    )
                  )}
                </div>
                <select
                  required
                  value={formData.deliveryType}
                  onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })}
                  disabled={selectedCategoryForcesAuto}
                  className={`w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-2 focus:outline-none focus:border-[#a855f7] ${selectedCategoryForcesAuto ? 'opacity-50 text-gray-400 cursor-not-allowed' : 'text-white'}`}
                >
                  <option value="MANUAL">Manual (Custom Delivery / Chat)</option>
                  <option value="AUTOMATIC">Automatic (Pre-uploaded Keys/Accounts)</option>
                </select>
                {selectedCategoryForcesAuto && (
                  <p className="text-xs text-[#00f5ff] mt-2 font-medium">This category strictly requires automatic code delivery. You cannot change this to manual.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">SKU Limit / Stock</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave blank for infinite (∞)"
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-white focus:outline-none focus:border-[#00f5ff] font-mono disabled:opacity-50"
                    value={formData.stockQuantity}
                    onChange={e => setFormData({ ...formData, stockQuantity: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Product Image</label>
                {/* Image preview / picker button */}
                <button
                  type="button"
                  onClick={() => setIsMediaOpen(true)}
                  className="w-full h-36 rounded-xl border-2 border-dashed border-[#27272a] hover:border-[#a855f7]/60 bg-[#09090b] overflow-hidden flex items-center justify-center transition-all group relative"
                >
                  {formData.image ? (
                    <>
                      <img src={formData.image} alt="Selected" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-bold">
                        <ImageIcon className="h-4 w-4" /> Change Image
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-[#a855f7] transition-colors">
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-sm font-medium">Click to select image</span>
                      <span className="text-xs font-mono">Opens media library</span>
                    </div>
                  )}
                </button>
                {formData.image && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: "" })}
                    className="mt-1 text-xs text-red-500 hover:text-red-400 font-mono"
                  >
                    ✕ Remove image
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea required rows={4} className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-white focus:outline-none focus:border-[#a855f7]" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-[#27272a] hover:bg-[#3f3f46] text-white py-3 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#a855f7] hover:bg-[#9333ea] text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      {isMediaOpen && (
        <MediaPickerModal
          currentUrl={formData.image}
          onSelect={(url) => setFormData({ ...formData, image: url })}
          onClose={() => setIsMediaOpen(false)}
        />
      )}
    </div>
  )
}
