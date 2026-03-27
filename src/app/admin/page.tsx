import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AdminOverviewClient from "./admin-overview-client"
import { getDashboardStatsForUser, getMaintenanceModeValue } from "@/lib/admin-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminOverview() {
  const session = await auth()
  
  // Dashboard is open to SELLERS, MANAGERS, and OWNERS
  if (!session || !["DEV", "SELLER", "MANAGER", "OWNER"].includes(session.user.role)) {
    redirect("/") 
  }

  const [initialStats, initialMaintenanceMode] = await Promise.all([
    getDashboardStatsForUser(session.user.role, session.user.id),
    session.user.role === "OWNER" ? getMaintenanceModeValue() : Promise.resolve(false)
  ])

  return (
    <AdminOverviewClient
      initialStats={initialStats}
      initialMaintenanceMode={initialMaintenanceMode}
    />
  )
}
