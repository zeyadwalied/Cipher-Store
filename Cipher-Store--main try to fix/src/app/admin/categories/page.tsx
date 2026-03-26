"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, ImageIcon, ChevronRight, Layers, GripVertical, Search } from "lucide-react"
import MediaPickerModal from "@/components/media-picker-modal"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Category = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  parentId: string | null
  parent?: { name: string } | null
  isAutomaticOnly: boolean
  sortOrder: number
  backgroundImageUrl: string | null
  children?: any[]
}

function SortableCategoryRow({ category, openEditModal, handleDelete }: { category: Category, openEditModal: (c: Category) => void, handleDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    position: isDragging ? 'relative' as const : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style} className={`border-b border-[#27272a] hover:bg-[#27272a]/20 transition-colors ${isDragging ? 'bg-[#27272a]/40 shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-[1.01]' : 'bg-transparent'}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <button {...attributes} {...listeners} className="cursor-grab text-gray-500 hover:text-[#00f5ff] px-1 opacity-50 hover:opacity-100 touch-none active:cursor-grabbing">
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="h-12 w-12 bg-[#09090b] border border-[#27272a] rounded-lg overflow-hidden flex items-center justify-center shrink-0">
            {category.imageUrl ? (
              <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-5 w-5 text-gray-700" />
            )}
          </div>
          <div>
            <div className="text-white font-bold text-base">{category.name}</div>
            <div className="text-xs text-gray-500 truncate max-w-[200px]">{category.description || "بدون وصف"}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {category.parent ? (
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-xs bg-[#a855f7]/10 text-[#a855f7] px-2 py-0.5 rounded border border-[#a855f7]/20">تابع لـ</span>
            <ChevronRight className="h-3 w-3 rotate-180" />
            <span className="font-medium">{category.parent.name}</span>
          </div>
        ) : (
          <span className="text-gray-600 text-xs flex items-center gap-1">
            <Layers className="h-3 w-3" /> قسم رئيسي
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        {category.isAutomaticOnly ? (
          <span className="bg-[#00f5ff]/10 text-[#00f5ff] px-3 py-1 rounded-full text-[10px] font-bold border border-[#00f5ff]/20 uppercase tracking-tighter shadow-[0_0_10px_rgba(0,245,255,0.1)]">
            تسليم تلقائي
          </span>
        ) : (
          <span className="text-gray-500 text-[10px] uppercase font-mono">يدوي</span>
        )}
      </td>
      <td className="px-6 py-4 text-left space-x-2 space-x-reverse">
        <button
          onClick={() => openEditModal(category)}
          className="text-[#0ea5e9] hover:text-white px-4 py-1.5 bg-[#0ea5e9]/5 hover:bg-[#0ea5e9] rounded-lg border border-[#0ea5e9]/20 transition-all text-xs font-bold"
        >
          تعديل
        </button>
        <button
          onClick={() => handleDelete(category.id)}
          className="text-red-500 hover:text-white px-4 py-1.5 bg-red-500/5 hover:bg-red-500 rounded-lg border border-red-500/20 transition-all text-xs font-bold"
        >
          حذف
        </button>
      </td>
    </tr>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMediaOpen, setIsMediaOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    backgroundImageUrl: "",
    parentId: "",
    isAutomaticOnly: false
  })
  const [isBackgroundMediaOpen, setIsBackgroundMediaOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/categories")
      if (res.ok) {
        setCategories(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      setCategories((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);

        const updates = newArray.map((cat, index) => ({ id: cat.id, sortOrder: index }));
        fetch("/api/admin/categories/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates)
        }).catch(err => console.error("Failed to reorder", err));

        return newArray;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const method = editingId ? "PUT" : "POST"
      const body = editingId ? { ...formData, id: editingId } : formData

      const res = await fetch("/api/admin/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        setIsModalOpen(false)
        setEditingId(null)
        setFormData({ name: "", description: "", imageUrl: "", backgroundImageUrl: "", parentId: "", isAutomaticOnly: false })
        fetchData()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openNewModal = () => {
    setEditingId(null)
    setFormData({ name: "", description: "", imageUrl: "", backgroundImageUrl: "", parentId: "", isAutomaticOnly: false })
    setIsModalOpen(true)
  }

  const openEditModal = (category: Category) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      backgroundImageUrl: category.backgroundImageUrl || "",
      parentId: category.parentId || "",
      isAutomaticOnly: category.isAutomaticOnly
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? Products in this category might be affected.")) return
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE" })
      if (res.ok) fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  // Filter possible parents (cannot be itself)
  const possibleParents = categories.filter(c => c.id !== editingId && !c.parentId)

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto pb-24 text-right" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white font-cyber tracking-tight text-right">إدارة الأقسام</h1>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="ابحث عن قسم..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#141417] border border-[#27272a] rounded-xl py-2 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-[#a855f7] text-right"
            />
          </div>
          <button
            onClick={openNewModal}
            className="bg-[#a855f7] hover:bg-[#9333ea] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]"
          >
            <Plus className="h-5 w-5" /> إضافة قسم جديد
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 bg-[#141417] rounded-2xl border border-[#27272a] text-gray-400">
          <div className="animate-pulse flex flex-col items-center">
            <Layers className="h-10 w-10 mb-4 opacity-20" />
            جاري تحميل الأقسام...
          </div>
        </div>
      ) : (
        <div className="bg-[#141417] border border-[#27272a] rounded-2xl overflow-hidden shadow-xl">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <table className="w-full text-right border-collapse">
                <thead className="bg-[#09090b] border-b border-[#27272a]">
                  <tr className="text-gray-400 text-xs uppercase tracking-widest font-mono">
                    <th className="px-6 py-5 font-medium">القسم</th>
                    <th className="px-6 py-5 font-medium">التبعية</th>
                    <th className="px-6 py-5 font-medium text-center">الإعدادات</th>
                    <th className="px-6 py-5 font-medium text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                        {searchTerm ? `لا توجد نتائج للبحث عن "${searchTerm}"` : "لا توجد أقسام حالياً. ابدأ بإنشاء واحد!"}
                      </td>
                    </tr>
                  ) : filteredCategories.map(category => (
                    <SortableCategoryRow key={category.id} category={category} openEditModal={openEditModal} handleDelete={handleDelete} />
                  ))}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#141417] border border-[#27272a] rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-[#27272a] flex justify-between items-center bg-[#09090b]/50">
              <h2 className="text-xl font-black text-white font-cyber tracking-tight">{editingId ? "تعديل القسم" : "إضافة قسم جديد"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white text-xl transition-colors">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Row 1: Name & Parent */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest font-mono">اسم القسم</label>
                  <input required type="text" className="w-full bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-white focus:outline-none focus:border-[#a855f7] transition-all" placeholder="مثلاً: ستيم" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest font-mono">قسم أب (اختياري)</label>
                  <select
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-white focus:outline-none focus:border-[#a855f7] transition-all appearance-none"
                    value={formData.parentId}
                    onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                  >
                    <option value="">قسم رئيسي (لا يتبع لأحد)</option>
                    {possibleParents.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Image */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest font-mono">أيقونة / صورة القسم</label>
                <button
                  type="button"
                  onClick={() => setIsMediaOpen(true)}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-[#27272a] hover:border-[#a855f7]/60 bg-[#09090b] overflow-hidden flex flex-col items-center justify-center transition-all group relative"
                >
                  {formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} alt="Selected" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-bold">
                        <ImageIcon className="h-4 w-4" /> تغيير الأيقونة
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-[#a855f7] transition-colors">
                      <ImageIcon className="h-8 w-8 opacity-20" />
                      <span className="text-xs font-bold">اختر أيقونة القسم</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Row 2.5: Background Image */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest font-mono">خلفية القسم (تظهر خلف الكروت)</label>
                <button
                  type="button"
                  onClick={() => setIsBackgroundMediaOpen(true)}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-[#27272a] hover:border-[#a855f7]/60 bg-[#09090b] overflow-hidden flex flex-col items-center justify-center transition-all group relative"
                >
                  {formData.backgroundImageUrl ? (
                    <>
                      <img src={formData.backgroundImageUrl} alt="Background Selected" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-bold">
                        <ImageIcon className="h-4 w-4" /> تغيير الخلفية
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-[#a855f7] transition-colors">
                      <Plus className="h-8 w-8 opacity-20" />
                      <span className="text-xs font-bold">اختر صورة خلفية مخصصة</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Row 3: Description */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest font-mono">الوصف</label>
                <textarea
                  rows={3}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-white focus:outline-none focus:border-[#a855f7] transition-all"
                  placeholder="وصف مختصر للقسم يظهر للمستخدمين"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Row 4: Automatic Toggle */}
              <div className="flex items-center gap-4 bg-[#09090b] p-4 rounded-xl border border-[#27272a]">
                <input
                  type="checkbox"
                  id="isAutomaticOnly"
                  checked={formData.isAutomaticOnly}
                  onChange={e => setFormData({ ...formData, isAutomaticOnly: e.target.checked })}
                  className="w-6 h-6 rounded border-[#27272a] bg-[#141417] text-[#a855f7] focus:ring-[#a855f7] focus:ring-offset-0 focus:ring-offset-transparent outline-none cursor-pointer"
                />
                <label htmlFor="isAutomaticOnly" className="text-sm font-bold text-white cursor-pointer select-none grow">
                  إجبار التسليم التلقائي فقط
                  <p className="text-[10px] text-gray-500 font-normal mt-0.5">المنتجات في هذا القسم ستكون مجبرة على نظام الأكواد التلقائي.</p>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-[#27272a] hover:bg-[#3f3f46] text-white py-4 rounded-xl font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#a855f7] hover:bg-[#9333ea] text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                >
                  {isSubmitting ? "جاري الحفظ..." : editingId ? "تحديث القسم" : "حفظ القسم"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker Modal for Icon */}
      {isMediaOpen && (
        <MediaPickerModal
          currentUrl={formData.imageUrl}
          onSelect={(url) => setFormData({ ...formData, imageUrl: url })}
          onClose={() => setIsMediaOpen(false)}
        />
      )}

      {/* Media Picker Modal for Background */}
      {isBackgroundMediaOpen && (
        <MediaPickerModal
          currentUrl={formData.backgroundImageUrl}
          onSelect={(url) => setFormData({ ...formData, backgroundImageUrl: url })}
          onClose={() => setIsBackgroundMediaOpen(false)}
        />
      )}
    </div>
  )
}
