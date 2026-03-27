import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AdminProductsClient from "./admin-products-client"
import { getAdminProductsData } from "@/lib/admin-products"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage() {
  const session = await auth()
  if (!session || !["DEV", "OWNER", "MANAGER", "SELLER"].includes(session.user.role)) {
    redirect("/admin")
  }

  const { products, categories } = await getAdminProductsData(session.user.role, session.user.id)

  return (
    <AdminProductsClient
      initialProducts={products}
      initialCategories={categories}
    />
  )
}
