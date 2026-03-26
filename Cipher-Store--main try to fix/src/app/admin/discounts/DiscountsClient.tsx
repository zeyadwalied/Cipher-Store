"use client"

import { useState } from "react"
import { Plus, Trash2, Edit, AlertCircle, RefreshCw, Layers, Tag, Globe, Link2, Check, Search } from "lucide-react"

type Props = {
  initialDiscounts: any[]
  categories: any[]
  products: any[]
}

export function DiscountsClient({ initialDiscounts, categories, products }: Props) {
  const [discounts, setDiscounts] = useState(initialDiscounts)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Form State
  const [name, setName] = useState("")
  const [type, setType] = useState("SINGLE") // SINGLE, CATEGORY, GENERAL, MIXED
  const [value, setValue] = useState("")
  const [isPercentage, setIsPercentage] = useState(true)

  // Specific Targets
  const [targetProductId, setTargetProductId] = useState("")
  const [targetCategoryId, setTargetCategoryId] = useState("")

  // Excluders (GENERAL)
  const [excludedProducts, setExcludedProducts] = useState<string[]>([])
  const [excludedCategories, setExcludedCategories] = useState<string[]>([])

  // MIXED
  const [mixedConditionType, setMixedConditionType] = useState("AND")
  const [mixedProductId, setMixedProductId] = useState("")
  const [mixedCategoryId, setMixedCategoryId] = useState("")

  const loadDiscounts = async () => {
    try {
      const res = await fetch("/api/admin/discounts")
      if (res.ok) setDiscounts(await res.json())
    } catch {}
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" })
    loadDiscounts()
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await fetch(`/api/admin/discounts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentStatus })
    })
    loadDiscounts()
  }

  const resetForm = () => {
    setName(""); setType("SINGLE"); setValue(""); setIsPercentage(true)
    setTargetProductId(""); setTargetCategoryId("")
    setExcludedProducts([]); setExcludedCategories([])
    setMixedConditionType("AND"); setMixedProductId(""); setMixedCategoryId("")
    setEditingId(null)
    setIsCreating(false)
  }

  const handleEdit = (d: any) => {
    setName(d.name)
    setType(d.type)
    setValue(d.value.toString())
    setIsPercentage(d.isPercentage)
    setTargetProductId(d.targetProductId || "")
    setTargetCategoryId(d.targetCategoryId || "")
    setExcludedProducts(d.excludedProductIds ? JSON.parse(d.excludedProductIds) : [])
    setExcludedCategories(d.excludedCategoryIds ? JSON.parse(d.excludedCategoryIds) : [])
    setMixedConditionType(d.mixedConditionType || "AND")
    setMixedProductId(d.mixedProductId || "")
    setMixedCategoryId(d.mixedCategoryId || "")
    setEditingId(d.id)
    setIsCreating(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const payload = {
      name, type, value, isPercentage,
      targetProductId: type === 'SINGLE' ? targetProductId : undefined,
      targetCategoryId: type === 'CATEGORY' ? targetCategoryId : undefined,
      excludedProductIds: type === 'GENERAL' ? excludedProducts : undefined,
      excludedCategoryIds: type === 'GENERAL' ? excludedCategories : undefined,
      mixedConditionType: type === 'MIXED' ? mixedConditionType : undefined,
      mixedProductId: type === 'MIXED' ? mixedProductId : undefined,
      mixedCategoryId: type === 'MIXED' ? mixedCategoryId : undefined,
    }

    try {
      const url = editingId ? `/api/admin/discounts/${editingId}` : "/api/admin/discounts"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        resetForm()
        loadDiscounts()
      } else {
        alert("Failed to save discount. Please check fields.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (t: string) => {
    switch(t) {
      case 'SINGLE': return <Tag className="h-4 w-4 text-[#0ea5e9]" />
      case 'CATEGORY': return <Layers className="h-4 w-4 text-[#a855f7]" />
      case 'GENERAL': return <Globe className="h-4 w-4 text-[#00ff41]" />
      case 'MIXED': return <Link2 className="h-4 w-4 text-[#f59e0b]" />
      default: return null
    }
  }

  const filteredDiscounts = discounts.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#27272a]">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide">نظام الخصومات التلقائية</h1>
          <p className="text-sm text-gray-400 mt-1">Discounts & Promotions Engine</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="ابحث عن عرض..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#141417] border border-[#27272a] rounded-xl py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-[#a855f7] text-right"
            />
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-[#a855f7] hover:bg-[#9333ea] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            إنشاء خصم جديد
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="bg-[#141417] border border-[#27272a] rounded-xl p-6 mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#00f5ff] to-[#a855f7]" />
          <h2 className="text-xl font-bold text-white mb-6">
            {editingId ? "تعديل العرض / الخصم" : "إضافة كود خصم / عرض جديد"}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">اسم العرض (للإدارة وللعملاء)</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: خصومات رمضان" className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-white focus:outline-none focus:border-[#00f5ff]" />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-2">قيمة الخصم</label>
                  <input required type="number" step="0.01" min="0" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-white focus:outline-none focus:border-[#00f5ff]" />
                </div>
                <div className="w-32">
                  <label className="block text-sm text-gray-400 mb-2">النوع</label>
                  <select value={isPercentage ? "true" : "false"} onChange={e => setIsPercentage(e.target.value === "true")} className="w-full bg-[#09090b] border border-[#27272a] rounded-lg p-3 text-white focus:outline-none focus:border-[#00f5ff]">
                    <option value="true">نسبة (%)</option>
                    <option value="false">مبلغ ثابت</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Application Type */}
            <div className="border-t border-[#27272a] pt-6">
              <label className="block text-sm font-bold text-white mb-4">نوع التطبيق (كيف سيتم تطبيق الخصم؟)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { id: 'SINGLE', label: 'منتج محدد', icon: <Tag/>, desc: 'يطبق على منتج واحد فقط' },
                  { id: 'CATEGORY', label: 'قسم كامل', icon: <Layers/>, desc: 'يطبق على كل منتجات القسم' },
                  { id: 'GENERAL', label: 'عام للكل', icon: <Globe/>, desc: 'يطبق على כל المتجر مع إمكانية الاستثناء' },
                  { id: 'MIXED', label: 'مختلط (Bundle)', icon: <Link2/>, desc: 'خصم معقد (اشتري X واحصل على Y)' },
                ].map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => setType(t.id)}
                    className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center text-center transition-all ${type === t.id ? 'border-[#00f5ff] bg-[#00f5ff]/10' : 'border-[#27272a] bg-[#09090b] hover:border-gray-500'}`}
                  >
                    <div className={`mb-2 ${type === t.id ? 'text-[#00f5ff]' : 'text-gray-500'}`}>{t.icon}</div>
                    <h3 className={`font-bold ${type === t.id ? 'text-[#00f5ff]' : 'text-gray-300'}`}>{t.label}</h3>
                    <p className="text-[10px] text-gray-500 mt-1">{t.desc}</p>
                  </div>
                ))}
              </div>

              {/* Conditional Inputs based on Type */}
              <div className="bg-[#09090b] p-6 rounded-xl border border-[#27272a]">
                
                {type === 'SINGLE' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">اختر المنتج</label>
                    <select required value={targetProductId} onChange={e => setTargetProductId(e.target.value)} className="w-full bg-black border border-[#27272a] rounded-lg p-3 text-white focus:border-[#00f5ff]">
                      <option value="">-- اختر منتج --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.price} EGP)</option>)}
                    </select>
                  </div>
                )}

                {type === 'CATEGORY' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">اختر القسم</label>
                    <select required value={targetCategoryId} onChange={e => setTargetCategoryId(e.target.value)} className="w-full bg-black border border-[#27272a] rounded-lg p-3 text-white focus:border-[#00f5ff]">
                      <option value="">-- اختر قسم --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                {type === 'GENERAL' && (
                  <div className="space-y-4">
                    <p className="text-sm text-[#00f5ff] mb-4 flex items-center gap-2">
                       الخصم العام يطبق على كل المتجر تلقائياً. يمكنك اختيار استثناء منتجات أو أقسام معينة من هذا الخصم (Excluder).
                    </p>
                    
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-sm text-gray-400">استثناء أقسام (لا يطبق عليها الخصم)</label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setExcludedCategories(categories.map((c: any) => c.id))} className="text-[10px] text-[#00f5ff] hover:underline bg-[#00f5ff]/10 px-2 py-0.5 rounded cursor-pointer">تحديد الكل</button>
                          <button type="button" onClick={() => setExcludedCategories([])} className="text-[10px] text-red-500 hover:underline bg-red-500/10 px-2 py-0.5 rounded cursor-pointer">إلغاء التحديد</button>
                        </div>
                      </div>
                      <select multiple value={excludedCategories} onChange={e => setExcludedCategories(Array.from(e.target.selectedOptions, option => option.value))} className="w-full bg-black border border-[#27272a] rounded-lg p-3 text-white focus:border-[#00f5ff] min-h-[100px]">
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <p className="text-[10px] text-gray-500 mt-1">اضغط Ctrl لتحديد أكثر من قسم</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-sm text-gray-400">استثناء منتجات (لا يطبق عليها الخصم)</label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setExcludedProducts(products.map((p: any) => p.id))} className="text-[10px] text-[#00f5ff] hover:underline bg-[#00f5ff]/10 px-2 py-0.5 rounded cursor-pointer">تحديد الكل</button>
                          <button type="button" onClick={() => setExcludedProducts([])} className="text-[10px] text-red-500 hover:underline bg-red-500/10 px-2 py-0.5 rounded cursor-pointer">إلغاء التحديد</button>
                        </div>
                      </div>
                      <select multiple value={excludedProducts} onChange={e => setExcludedProducts(Array.from(e.target.selectedOptions, option => option.value))} className="w-full bg-black border border-[#27272a] rounded-lg p-3 text-white focus:border-[#00f5ff] min-h-[150px]">
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.price} EGP)</option>)}
                      </select>
                      <p className="text-[10px] text-gray-500 mt-1">اضغط Ctrl لتحديد أكثر من منتج</p>
                    </div>
                  </div>
                )}

                {type === 'MIXED' && (
                  <div className="space-y-4">
                     <p className="text-sm text-yellow-500 mb-4 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                       بناء الخصم المزدوج: العميل سيحصل على هذا الخصم على الطلب بالكامل في حالة توافر (المنتج X) **و/أو** (القسم Y) معاً في سلة المشتروات.
                     </p>
                     
                     <div className="flex items-center gap-4">
                       <div className="flex-[2]">
                          <label className="block text-sm text-gray-400 mb-2">المنتج المطلوب بالسلّة</label>
                          <select value={mixedProductId} onChange={e => setMixedProductId(e.target.value)} className="w-full bg-black border border-[#27272a] rounded-lg p-3 text-white">
                            <option value="">-- أي منتج --</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                       </div>
                       
                       <div className="flex-1">
                          <label className="block text-sm text-gray-400 mb-2 text-center">الشرط</label>
                          <select value={mixedConditionType} onChange={e => setMixedConditionType(e.target.value)} className="w-full bg-[#141417] border border-[#a855f7] text-[#a855f7] font-bold rounded-lg p-3 text-center">
                            <option value="AND">و (AND)</option>
                            <option value="OR">أو (OR)</option>
                          </select>
                       </div>

                       <div className="flex-[2]">
                          <label className="block text-sm text-gray-400 mb-2">القسم المطلوب بالسلّة</label>
                          <select value={mixedCategoryId} onChange={e => setMixedCategoryId(e.target.value)} className="w-full bg-black border border-[#27272a] rounded-lg p-3 text-white">
                            <option value="">-- أي قسم --</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                       </div>
                     </div>
                  </div>
                )}

              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#27272a]">
              <button type="button" onClick={resetForm} className="px-5 py-2 rounded-lg text-gray-400 hover:text-white transition-colors">إلغاء</button>
              <button disabled={isLoading} type="submit" className="bg-[#00f5ff] text-black font-bold px-6 py-2 rounded-lg hover:bg-[#00e5ee] transition-colors disabled:opacity-50">
                {isLoading ? "جاري الحفظ..." : (editingId ? "تحديث العرض 🔄" : "حفظ العرض المذهل 🚀")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List Active/Inactive Discounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDiscounts.length === 0 && !isCreating && (
          <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-[#27272a] rounded-xl flex flex-col items-center">
             <Globe className="h-12 w-12 opacity-20 mb-3" />
             <p>{searchTerm ? `لا توجد عروض تطابق "${searchTerm}"` : "لا يوجد أي عروض أو خصومات نشطة حالياً."}</p>
          </div>
        )}
        
        {filteredDiscounts.map(d => (
          <div key={d.id} className={`cyber-card p-5 rounded-xl border relative overflow-hidden flex flex-col ${d.isActive ? 'border-[#00f5ff]/30 bg-[#141417]' : 'border-[#27272a] bg-[#09090b]'}`}>
            {d.isActive && <div className="absolute top-0 right-0 w-1 h-full bg-[#00f5ff]" />}
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                 <div className="bg-[#27272a] p-2 rounded-lg">
                    {getTypeIcon(d.type)}
                 </div>
                 <div>
                   <h3 className="text-white font-bold">{d.name}</h3>
                   <span className="text-[10px] text-gray-500 uppercase tracking-widest">{d.type}</span>
                 </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-[#00f5ff]">
                  {d.value}{d.isPercentage ? '%' : 'EGP'}
                </span>
                <span className="block text-[10px] text-gray-400">OFF</span>
              </div>
            </div>

            <div className="flex-1 text-xs text-gray-400 font-mono mb-4 border-t border-[#27272a] pt-3 break-words">
              {d.type === 'SINGLE' && <p>Targets Product ID: {d.targetProductId}</p>}
              {d.type === 'CATEGORY' && <p>Targets Category ID: {d.targetCategoryId}</p>}
              {d.type === 'GENERAL' && (
                <p>Global Store Discount<br/>
                <span className="text-red-400">
                  {d.excludedProductIds ? `Excludes ${JSON.parse(d.excludedProductIds).length} products` : ''} 
                  {d.excludedProductIds && d.excludedCategoryIds ? ' & ' : ''}
                  {d.excludedCategoryIds ? `Excludes ${JSON.parse(d.excludedCategoryIds).length} categories` : ''}
                </span>
                </p>
              )}
              {d.type === 'MIXED' && (
                <p>Bundle Rule: Product {d.mixedProductId || 'Any'} <strong className="text-yellow-500">{d.mixedConditionType}</strong> Category {d.mixedCategoryId || 'Any'}</p>
              )}
            </div>

            <div className="flex justify-between items-center border-t border-[#27272a] pt-3 mt-auto">
              <button 
                onClick={() => handleToggleActive(d.id, d.isActive)}
                className={`text-xs px-3 py-1 rounded-full border ${d.isActive ? 'border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41]/10' : 'border-gray-500 text-gray-500 hover:text-white hover:border-white'}`}
              >
                {d.isActive ? "ACTIVE" : "INACTIVE"}
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(d)}
                  className="text-gray-500 hover:text-[#0ea5e9] p-1 transition-colors"
                  title="Edit Discount"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDelete(d.id)}
                  className="text-gray-500 hover:text-red-500 p-1 transition-colors"
                  title="Delete Discount"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
