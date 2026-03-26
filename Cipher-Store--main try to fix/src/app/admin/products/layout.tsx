import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AdminProductsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || !["OWNER", "MANAGER", "SELLER"].includes(session.user.role)) {
    redirect("/admin/support")
  }

  return <>{children}</>
}
