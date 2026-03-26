import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Package, Search, ExternalLink, Calendar, CheckSquare } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function MyOrdersPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: { select: { name: true, image: true, deliveryType: true } },
          stockItems: true // get the specific attached keys if any exist
        }
      },
      chat: true
    }
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 pb-24">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-white mb-4 tracking-tight flex items-center justify-center gap-3">
          <Package className="h-10 w-10 text-[#a855f7]" />
          طلباتي
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          عرض سجل مشترياتك والوصول إلى منتجاتك الرقمية.
        </p>
      </div>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="bg-[#141417] border border-[#27272a] rounded-2xl p-12 text-center text-gray-400">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-50 text-[#a855f7]" />
            <h3 className="text-xl font-bold text-white mb-2">لم تقم بشراء أي شيء حتى الآن.</h3>
            <p className="mb-6">تصفح متجر Cipher Store للعثور على عناصر حصرية.</p>
            <Link
              href="/"
              className="px-6 py-3 bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-lg font-bold transition-colors inline-block"
            >
              تصفح المتجر
            </Link>
          </div>
        ) : orders.map(order => (
          <div key={order.id} className="bg-[#141417] border border-[#27272a] rounded-2xl overflow-hidden hover:border-[#3f3f46] transition-colors">

            {/* Header */}
            <div className="bg-[#09090b] p-6 border-b border-[#27272a] flex flex-col md:flex-row md:items-center justify-between gap-4 flex-row-reverse text-right" dir="rtl">
              <div>
                <div className="flex items-center gap-4 mb-2 flex-row-reverse">
                  <span className="font-mono text-sm text-gray-400">طلب #{order.id.slice(-8)}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                      order.status === 'PAID' ? 'bg-blue-500/10 text-blue-500' :
                        order.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' :
                          'bg-yellow-500/10 text-yellow-500'
                    }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400 flex-row-reverse">
                  <span className="flex items-center gap-1.5 flex-row-reverse"><Calendar className="h-4 w-4" /> {new Date(order.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span dir="ltr">الإجمالي: <strong className="text-white">{order.total.toFixed(2)} EGP</strong> ({order.paymentMethod})</span>
                </div>
              </div>

              {order.chat && (
                <Link
                  href={`/chat/${order.chat.id}`}
                  className="bg-[#27272a] hover:bg-[#3f3f46] px-4 py-2 rounded-lg text-sm text-white font-medium transition-colors flex items-center gap-2 w-fit flex-row-reverse"
                >
                  <ExternalLink className="h-4 w-4" /> الذهاب لمحادثة الطلب
                </Link>
              )}
            </div>


            {/* Items */}
            <div className="p-6">
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex flex-col md:flex-row gap-6 p-4 rounded-xl border border-[#27272a] bg-[#09090b]">
                    <div className="h-24 w-24 bg-[#141417] rounded-lg border border-[#27272a] overflow-hidden shrink-0">
                      {item.product.image ? (
                        <img src={item.product.image} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600"><Package className="h-8 w-8" /></div>
                      )}
                    </div>

                    <div className="flex-1 text-sm text-gray-400 group relative">
                      <div className="flex justify-between items-start mb-2 flex-row-reverse text-right">
                        <div>
                          <h4 className="text-lg font-bold text-white leading-tight mb-1">{item.product.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.product.deliveryType === 'AUTOMATIC' ? 'bg-[#0ea5e9]/10 text-[#0ea5e9]' : 'bg-gray-500/10 text-gray-400'}`}>
                            تسليم {item.product.deliveryType === 'AUTOMATIC' ? 'تلقائي' : 'يدوي'}
                          </span>
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-white mb-1" dir="ltr">{item.price.toFixed(2)} EGP</div>
                          <div className="text-xs">الكمية: {item.quantity}</div>
                        </div>
                      </div>

                      {/* Display Secret Data if the Order is Completed AND its Automatic! */}
                      {item.product.deliveryType === 'AUTOMATIC' && (
                        <div className="mt-4 pt-4 border-t border-[#27272a]">
                          {order.status !== 'COMPLETED' ? (
                            <div className="text-yellow-500 text-xs font-medium flex items-center gap-2 flex-row-reverse justify-end">
                              <CheckSquare className="h-4 w-4" /> بانتظار تأكيد الإدارة لتسليم المنتج الرقمي.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {item.stockItems.map((si: any, idx: number) => (
                                <div key={si.id} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-[#141417] p-3 rounded-lg border border-[#3f3f46] flex-row-reverse">
                                  <span className="text-xs font-bold text-gray-500 uppercase">عنصر {idx + 1}:</span>
                                  <code className="text-[#a855f7] font-mono font-bold break-all select-all flex-1 text-right" dir="ltr">
                                    {si.data}
                                  </code>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
