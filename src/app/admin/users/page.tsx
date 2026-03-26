import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import UsersClient from "./users-client"
import { getVerifiedUser } from "@/lib/admin-check"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const currentUser = await getVerifiedUser(["OWNER"])
  if (!currentUser) {
    redirect("/admin/products")
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  })

  return <UsersClient initialUsers={users} currentUser={currentUser} />
}
