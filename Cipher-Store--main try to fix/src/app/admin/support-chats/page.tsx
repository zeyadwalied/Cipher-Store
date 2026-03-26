import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LifeBuoy } from "lucide-react"
import { SupportChatsClient } from "./SupportChatsClient"

export const dynamic = "force-dynamic"

export default async function AdminSupportChatsPage() {
  const session = await auth()
  if (!session || !["OWNER", "MANAGER", "SUPPORT"].includes(session.user.role)) {
    redirect("/admin/products")
  }

  const chats = await prisma.chat.findMany({
    where: {
      type: "SUPPORT",
      status: { notIn: ['DELETED', 'CLOSED_BY_WEB', 'CLOSED_BY_DISCORD'] }
    },
    orderBy: { updatedAt: "desc" },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, role: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  })

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-8">
        <LifeBuoy className="h-8 w-8 text-yellow-500" />
        <h1 className="text-3xl font-bold text-white">Support Chats</h1>
      </div>

      <SupportChatsClient initialChats={chats} currentUser={session.user} />
    </div>
  )
}
