import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AdminCategoriesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || !["OWNER", "MANAGER"].includes(session.user.role)) {
    redirect("/admin/products")
  }

  return <>{children}</>
}
