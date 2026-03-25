import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AdminOverviewClient from "./admin-overview-client"

export const dynamic = "force-dynamic"

export default async function AdminOverview() {
  const session = await auth()
  
  // Dashboard is open to SELLERS, MANAGERS, and OWNERS
  if (!session || !["DEV", "SELLER", "MANAGER", "OWNER"].includes(session.user.role)) {
    redirect("/") 
  }

  return <AdminOverviewClient />
}
