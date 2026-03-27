import prisma from "@/lib/prisma"
import { Package, Search } from "lucide-react"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AdminOrdersClient from "./admin-orders-client"

export const dynamic = "force-dynamic"

export default async function AdminOrdersPage() {
  const session = await auth()
  if (!session || !["DEV", "OWNER", "MANAGER"].includes(session.user.role)) {
    redirect("/admin/products")
  }
  const orders = await prisma.order.findMany({
    select: {
      id: true,
      userId: true,
      total: true,
      status: true,
      createdAt: true,
      confirmationSource: true,
      senderPhoneNumber: true,
      receiptImageUrl: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-8">
      </div>

      <AdminOrdersClient initialOrders={orders} currentUserRole={session.user.role} />
    </div>
  )
}
