import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Package, User, Clock, Settings, Wallet } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session || !session.user) {
    redirect("/login")
  }

  // Fetch orders from database
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } }
  })

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-12 border-b border-[#27272a] pb-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">My Dashboard</h1>
          <p className="text-gray-400">Welcome back, {session.user.name}</p>
        </div>
        {session.user.role === 'ADMIN' && (
          <Link href="/admin" className="bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-2 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            Admin Panel
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-[#141417] border border-[#27272a] rounded-xl p-6 mb-6 text-center">
            <div className="h-20 w-20 rounded-full bg-[#27272a] flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4 border-2 border-[#a855f7]">
              {session.user.name?.charAt(0) || 'U'}
            </div>
            <h3 className="text-lg font-bold text-white">{session.user.name}</h3>
            <p className="text-xs text-gray-400 mb-4">{session.user.email}</p>
            <div className="inline-flex py-1 px-3 rounded bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold uppercase">
              {session.user.role}
            </div>
          </div>
          
          <nav className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-4 py-3 bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/30 rounded-lg font-medium transition-colors">
              <Package className="h-5 w-5" /> Order History
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-[#141417] hover:text-white rounded-lg font-medium transition-colors">
              <User className="h-5 w-5" /> Profile Settings
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-[#141417] hover:text-white rounded-lg font-medium transition-colors">
              <Wallet className="h-5 w-5" /> Billing Info
            </a>
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-[#141417] border border-[#27272a] rounded-xl p-6 min-h-[500px]">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#a855f7]" /> Recent Orders
            </h2>

            {orders.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-[#27272a] rounded-xl">
                <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No orders yet</h3>
                <p className="text-gray-400 mb-6 text-sm">You haven't placed any orders. Start browsing our catalog.</p>
                <Link href="/" className="bg-white text-black font-bold py-2 px-6 rounded-lg hover:bg-gray-200 transition-colors">
                  Shop Now
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: any) => (
                  <div key={order.id} className="border border-[#27272a] rounded-xl p-5 bg-[#09090b]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#27272a] pb-4 mb-4 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Order ID: {order.id}</div>
                        <div className="text-sm font-medium text-gray-300">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          order.status === 'COMPLETED' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                          order.status === 'PAID' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' :
                          'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                        }`}>
                          {order.status}
                        </div>
                        <div className="text-lg font-bold text-white">{order.total.toFixed(2)} EGP</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {order.items.map((item: any, idx: number) => (
                        <div key={item.id} className="flex justify-between items-center bg-[#141417] p-3 rounded-lg border border-[#27272a]/50">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-[#27272a] rounded flex items-center justify-center">
                              <Package className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{item.product.name}</div>
                              <div className="text-xs text-gray-400">Qty: {item.quantity}</div>
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-300">
                            {item.price.toFixed(2)} EGP
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Link href={`/tracking?id=${order.id}`} className="text-[#a855f7] hover:text-[#9333ea] text-sm font-medium flex items-center gap-1 transition-colors">
                        Track Order &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  )
}
