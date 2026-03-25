import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { MessageSquare } from "lucide-react"
import AdminChatsClient from "./admin-chats-client"

export const dynamic = "force-dynamic"

export default async function AdminAllChatsPage() {
  const session = await auth()
  if (!session || !["OWNER", "MANAGER"].includes(session.user.role)) {
    redirect("/admin/products")
  }

  const chats = await prisma.chat.findMany({
    where: { status: { not: "DELETED" } },
    orderBy: { updatedAt: "desc" },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true } },
      order: { select: { id: true, status: true, total: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  })

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="h-8 w-8 text-[#a855f7]" />
        <h1 className="text-3xl font-bold text-white">All Chats</h1>
        <span className="ml-auto text-sm text-gray-500">{chats.length} conversation{chats.length !== 1 ? "s" : ""}</span>
      </div>
      <AdminChatsClient chats={chats} currentUserRole={session.user.role} />
    </div>
  )
}
