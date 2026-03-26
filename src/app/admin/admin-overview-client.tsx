"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Package, Users, ShoppingCart, DollarSign, Activity, ShieldAlert, Power } from "lucide-react"

export default function AdminOverviewClient() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false)

  useEffect(() => {
    fetch("/api/admin/dashboard-stats")
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setIsLoading(false)
      })
      .catch(e => {
        console.error(e)
        setIsLoading(false)
      })

    // Fetch Maintenance Mode strictly for UI state (OWNER only)
    fetch("/api/admin/maintenance")
      .then(res => {
        if(res.ok) return res.json();
        return { isMaintenanceMode: false };
      })
      .then(data => setIsMaintenanceMode(data.isMaintenanceMode))
      .catch(console.error)
  }, [])

  const toggleMaintenance = async () => {
    if (isMaintenanceMode) {
      if (!confirm("Are you sure you want to disable Maintenance Mode and OPEN the site to the public?")) return;
    } else {
      if (!confirm("WARNING: This will instantly lock out ALL customers and enable Cyber Maintenance Mode. Are you sure?")) return;
    }
    
    setIsTogglingMaintenance(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        body: JSON.stringify({ isMaintenanceMode: !isMaintenanceMode })
      });
      const data = await res.json();
      if (data.success) {
        setIsMaintenanceMode(data.isMaintenanceMode);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTogglingMaintenance(false);
    }
  }

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-[#141417] rounded-xl border border-[#27272a]"></div>
  }

  if (!stats) return <div className="text-white">Failed to load stats.</div>

  const isOwnerOrManager = session?.user?.role === "OWNER" || session?.user?.role === "MANAGER"
  
  // Choose which stats to show based on role
  const displayStats = isOwnerOrManager ? stats.overall : stats.personal
  const statCards = [
    { title: isOwnerOrManager ? "Total Platform Revenue" : "Your Earnings", value: `${displayStats?.revenue?.toFixed(2) || 0} EGP`, icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
    { title: isOwnerOrManager ? "Total Orders" : "Orders containing your items", value: displayStats?.orders || 0, icon: ShoppingCart, color: "text-[#0ea5e9]", bg: "bg-[#0ea5e9]/10" },
    { title: "Your Active Products", value: displayStats?.products || 0, icon: Package, color: "text-[#a855f7]", bg: "bg-[#a855f7]/10" },
  ]

  if (isOwnerOrManager) {
    statCards.push({ title: "Registered Users", value: displayStats?.users || 0, icon: Users, color: "text-yellow-500", bg: "bg-yellow-500/10" })
  }

  return (
    <div className="max-w-6xl mx-auto">

      {session?.user?.role === "OWNER" && (
        <div className={`mb-8 p-6 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500 ${isMaintenanceMode ? 'bg-[#ff003c]/10 border-[#ff003c]/50 shadow-[0_0_30px_rgba(255,0,60,0.15)]' : 'bg-[#141417] border-[#27272a]'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isMaintenanceMode ? 'bg-[#ff003c]/20 text-[#ff003c] animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${isMaintenanceMode ? 'text-[#ff003c]' : 'text-white'}`}>
                {isMaintenanceMode ? 'SYSTEM LOCKED: MAINTENANCE ACTIVE' : 'System Status: Nominal'}
              </h2>
              <p className="text-gray-400 text-sm">
                {isMaintenanceMode ? 'All public traffic is currently blocked. Only the OWNER can access the site.' : 'The store is currently open and accepting traffic normally.'}
              </p>
            </div>
          </div>
          <button 
            onClick={toggleMaintenance}
            disabled={isTogglingMaintenance}
            className={`px-8 py-3 rounded-lg flex items-center gap-2 font-bold uppercase tracking-wider transition-all duration-300 ${isMaintenanceMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'}`}
          >
            <Power className="w-5 h-5" />
            {isTogglingMaintenance ? 'PROCESSING...' : isMaintenanceMode ? 'DISABLE MAINTENANCE' : 'ENGAGE LOCKDOWN'}
          </button>
        </div>
      )}

      <h1 className="text-3xl font-bold text-white mb-8">
        {isOwnerOrManager ? "Platform Overview" : "Seller Dashboard"}
      </h1>
      
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${statCards.length} gap-6 mb-12`}>
        {statCards.map((stat, i) => (
          <div key={i} className="bg-[#141417] border border-[#27272a] rounded-xl p-6 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${stat.bg}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">{stat.title}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {!isOwnerOrManager && (
        <div className="bg-[#141417] border border-[#27272a] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#a855f7]" /> Recent Sales (Your Products)
          </h2>
          {stats.recentSales?.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No sales generated yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#27272a] text-gray-400 text-sm">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Date Sold</th>
                    <th className="pb-3 font-medium">Order Status</th>
                    <th className="pb-3 font-medium text-right">Earned</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {stats.recentSales?.map((item: any) => (
                    <tr key={item.id} className="border-b border-[#27272a] hover:bg-[#27272a]/20">
                      <td className="py-4 text-white font-medium">{item.productName}</td>
                      <td className="py-4 text-gray-400">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 'bg-[#a855f7]/10 text-[#a855f7]'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 text-white font-bold text-right text-green-400">+{item.amount.toFixed(2)} EGP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
