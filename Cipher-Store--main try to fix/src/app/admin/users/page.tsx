import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import UsersClient from "./users-client"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session || session.user.role !== "OWNER") {
    redirect("/admin/products")
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  })

  return <UsersClient initialUsers={users} currentUser={session.user} />
}
