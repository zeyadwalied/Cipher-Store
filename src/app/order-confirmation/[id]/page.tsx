import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle2,
  Package,
  MessageSquare,
  Tag,
  Layers,
  CreditCard,
  Clock,
  ArrowRight,
  ShoppingBag,
  Zap,
  Key,
  ClipboardList
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect("/login")

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      chat: true,
      items: {
        include: {
          product: {
            select: {
              name: true,
              image: true,
              deliveryType: true,
              category: { select: { name: true } }
            }
          },
          stockItems: { select: { id: true, data: true } }
        }
      }
    }
  })

  if (!order || order.userId !== session.user.id) notFound()

  const isAutomatic = order.items.some(i => i.product.deliveryType === "AUTOMATIC")
  const isCompleted = order.status === "COMPLETED"

  return (
    <div className="min-h-screen bg-[#09090b] py-12 px-4">
      <div className="max-w-3xl mx-auto" dir="rtl">

        {/* Hero Success Block */}
        <div className="relative bg-gradient-to-br from-[#1a0d2e] via-[#141417] to-[#09090b] border border-[#a855f7]/30 rounded-3xl p-10 text-center mb-8 overflow-hidden">
          {/* Glow ring */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#a855f7]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[#a855f7]/15 border border-[#a855f7]/40 mx-auto mb-5">
              <CheckCircle2 className="h-10 w-10 text-[#a855f7]" />
            </div>

            <h1 className="text-4xl font-black text-white mb-3 tracking-tight">
              شكراً لك، {order.user?.name?.split(" ")[0] || "عميلنا العزيز"}!
            </h1>
            <p className="text-gray-400 text-lg mb-5 max-w-lg mx-auto">
              تم استلام طلبك وهو قيد المعالجة. إليك كل ما تحتاج لمعرفته.
            </p>

            {/* Order ID badge */}
            <div className="inline-flex items-center gap-2 bg-[#27272a]/60 border border-[#3f3f46] rounded-full px-5 py-2 text-sm font-mono text-gray-300 flex-row-reverse">
              <Package className="h-4 w-4 text-[#a855f7]" />
              الطلب&nbsp;<span className="text-white font-bold" dir="ltr">#{order.id.slice(-10).toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Order Meta Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: <CreditCard className="h-4 w-4" />, label: "الدفع", value: order.paymentMethod.replace("_", " ") },
            { icon: <Clock className="h-4 w-4" />, label: "التاريخ", value: new Date(order.createdAt).toLocaleDateString("en-GB") },
            { icon: <Tag className="h-4 w-4" />, label: "الإجمالي", value: `${order.total.toFixed(2)} EGP` },
            { icon: <Layers className="h-4 w-4" />, label: "الحالة", value: order.status === "COMPLETED" ? "مكتمل" : order.status === "PENDING" ? "قيد الانتظار" : order.status === "PAID" ? "تم الدفع" : order.status === "CANCELLED" ? "ملغى" : order.status, status: true }
          ].map((meta, i) => (
            <div key={i} className="bg-[#141417] border border-[#27272a] rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-2 uppercase tracking-widest font-medium">
                {meta.icon} {meta.label}
              </div>
              <div className={`font-bold text-sm ${meta.status
                ? order.status === "COMPLETED" ? "text-green-400"
                  : order.status === "PENDING" ? "text-yellow-400"
                    : order.status === "PAID" ? "text-blue-400"
                      : "text-red-400"
                : "text-white"}`}>
                {meta.value}
              </div>
            </div>
          ))}
        </div>

        {/* Order Items */}
        <div className="bg-[#141417] border border-[#27272a] rounded-2xl overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-[#27272a] flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#a855f7]" />
            <h2 className="font-bold text-white">عناصر الطلب</h2>
          </div>

          <div className="divide-y divide-[#27272a]">
            {order.items.map(item => (
              <div key={item.id} className="p-6 flex gap-5">
                {/* Product Image */}
                <div className="w-20 h-20 rounded-xl border border-[#27272a] overflow-hidden bg-[#09090b] shrink-0">
                  {item.product.image ? (
                    <img src={item.product.image} className="w-full h-full object-cover" alt={item.product.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700">
                      <Package className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-white font-bold text-base leading-tight mb-1 truncate text-right">
                        {item.product.name}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-right justify-start">
                        {item.product.category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#27272a] text-gray-400 px-2 py-0.5 rounded-full">
                            {item.product.category.name}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${item.product.deliveryType === "AUTOMATIC"
                            ? "bg-cyan-500/10 text-cyan-400"
                            : "bg-gray-500/10 text-gray-400"
                          }`}>
                          {item.product.deliveryType === "AUTOMATIC"
                            ? <><Zap className="h-3 w-3" /> تسليم تلقائي</>
                            : <><ClipboardList className="h-3 w-3" /> تسليم يدوي</>
                          }
                        </span>
                      </div>
                    </div>
                    <div className="text-left shrink-0" dir="ltr">
                      <div className="text-white font-bold">{item.price.toFixed(2)} EGP</div>
                      <div className="text-gray-500 text-xs text-right" dir="rtl">الكمية: {item.quantity}</div>
                    </div>
                  </div>

                  {/* Delivery keys if AUTOMATIC & COMPLETED */}
                  {item.product.deliveryType === "AUTOMATIC" && (
                    <div className="mt-3 pt-3 border-t border-[#27272a]">
                      {!isCompleted ? (
                        <div className="flex items-center gap-2 text-yellow-400 text-xs font-medium bg-yellow-400/5 border border-yellow-400/20 rounded-lg px-3 py-2 text-right">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>بانتظار تأكيد الإدارة. سيظهر الكود الخاص بك هنا بمجرد الموافقة على الطلب.</span>
                        </div>
                      ) : item.stockItems.length > 0 ? (
                        <div className="space-y-2">
                          {item.stockItems.map((si, idx) => (
                            <div key={si.id} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-[#09090b] border border-[#a855f7]/30 rounded-xl px-4 py-3 text-right">
                              <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                                <Key className="h-3.5 w-3.5 text-[#a855f7]" />
                                {item.quantity > 1 ? `مفتاح ${idx + 1}` : "مفتاحك"}
                              </div>
                              <code className="flex-1 text-[#a855f7] font-mono font-bold text-sm break-all select-all">
                                {si.data}
                              </code>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}

                  {item.product.deliveryType === "MANUAL" && (
                    <div className="mt-3 pt-3 border-t border-[#27272a]">
                      <div className="flex items-center gap-2 text-blue-400 text-xs font-medium bg-blue-400/5 border border-blue-400/20 rounded-lg px-3 py-2 text-right">
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span>يتم تسليم هذا العنصر يدوياً. تحقق من محادثة الطلب للحصول على تحديثات من البائع.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total Row */}
          <div className="px-6 py-4 border-t border-[#27272a] flex justify-between items-center bg-[#09090b]/50 flex-row text-left">
            <span className="text-white font-black text-xl" dir="ltr">{order.total.toFixed(2)} EGP</span>
            <span className="text-gray-400 text-sm font-medium">إجمالي الطلب</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {order.chat && (
            <Link
              href={`/chat/${order.chat.id}`}
              className="flex-1 flex items-center justify-center gap-2 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-3 rounded-xl transition-colors"
            >
              <MessageSquare className="h-5 w-5" />
              الذهاب لمحادثة الطلب
              <ArrowRight className="h-4 w-4 rotate-180" />
            </Link>
          )}
          <Link
            href="/orders"
            className="flex-1 flex items-center justify-center gap-2 bg-[#141417] hover:bg-[#27272a] border border-[#27272a] text-white font-bold py-3 rounded-xl transition-colors"
          >
            <Package className="h-5 w-5" />
            عرض جميع الطلبات
          </Link>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 bg-[#141417] hover:bg-[#27272a] border border-[#27272a] text-gray-300 font-medium py-3 rounded-xl transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            متابعة التسوق
          </Link>
        </div>

      </div>
    </div>
  )
}
