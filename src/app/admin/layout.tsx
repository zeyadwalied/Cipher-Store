import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ShieldAlert, LayoutDashboard, PackageSearch, Users, ShoppingCart, LogOut, MessageSquare, Database, Tag } from "lucide-react"
import prisma from "@/lib/prisma"
import { isProtectedUser } from "@/lib/protected-user"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  const allowedRoles = ["DEV", "OWNER", "MANAGER", "SELLER", "SUPPORT"]
  if (!session?.user?.id) {
    redirect("/")
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBlocked: true, email: true }
  })

  const resolvedRole = isProtectedUser(session.user.email || dbUser?.email) ? "OWNER" : dbUser?.role

  if (!dbUser || dbUser.isBlocked || !resolvedRole || !allowedRoles.includes(resolvedRole)) {
    redirect("/")
  }

  const role = resolvedRole

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#09090b]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#27272a] bg-[#141417] flex flex-col hidden md:flex">
        <div className="p-6 border-b border-[#27272a]">
          <Link href="/" className="flex items-center gap-0 text-xl font-bold tracking-tighter text-white">
            <img
              src="/favicon.ico.png"
              alt="Logo"
              className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(0,245,255,0.8)] shrink-0"
            />
            <span className="font-cyber bg-gradient-to-r from-[#00f5ff] to-[#a855f7] bg-clip-text text-transparent tracking-wider text-sm">
              ipher Store
            </span>
          </Link>
          <div className="mt-4 flex items-center gap-2 px-1">
            <ShieldAlert className="h-3 w-3 text-gray-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Management</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {["DEV", "OWNER", "MANAGER"].includes(role) && (
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#27272a] hover:text-white rounded-lg transition-colors group">
              <LayoutDashboard className="h-5 w-5 group-hover:text-[#a855f7]" />
              Dashboard Overview
            </Link>
          )}
          {["DEV", "OWNER", "MANAGER", "SELLER"].includes(role) && (
            <Link href="/admin/products" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#27272a] hover:text-white rounded-lg transition-colors group">
              <PackageSearch className="h-5 w-5 group-hover:text-[#a855f7]" />
              Products
            </Link>
          )}
          {["DEV", "OWNER", "MANAGER", "SELLER"].includes(role) && (
            <Link href="/admin/stock" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#27272a] hover:text-white rounded-lg transition-colors group">
              <Database className="h-5 w-5 group-hover:text-[#00f5ff]" />
              Code Storage
            </Link>
          )}
          {["DEV", "OWNER", "MANAGER"].includes(role) && (
            <Link href="/admin/discounts" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#27272a] hover:text-white rounded-lg transition-colors group">
              <Tag className="h-5 w-5 group-hover:text-[#a855f7]" />
              Promotions
            </Link>
          )}
          {["DEV", "OWNER", "MANAGER"].includes(role) && (
            <Link href="/admin/categories" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#27272a] hover:text-white rounded-lg transition-colors group">
              <ShoppingCart className="h-5 w-5 group-hover:text-[#a855f7]" />
              Categories
            </Link>
          )}
          {["DEV", "OWNER", "MANAGER"].includes(role) && (
            <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#27272a] hover:text-white rounded-lg transition-colors group">
              <ShoppingCart className="h-5 w-5 group-hover:text-[#0ea5e9]" />
              Orders
            </Link>
          )}
          {["DEV", "OWNER", "MANAGER"].includes(role) && (
            <Link href="/admin/chats" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#27272a] hover:text-white rounded-lg transition-colors group">
              <MessageSquare className="h-5 w-5 group-hover:text-[#a855f7]" />
              All Chats
            </Link>
          )}
          {["DEV", "OWNER"].includes(role) && (
            <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#27272a] hover:text-white rounded-lg transition-colors group">
              <Users className="h-5 w-5 group-hover:text-green-500" />
              Users
            </Link>
          )}
          {["DEV", "OWNER", "MANAGER", "SUPPORT"].includes(role) && (
            <Link href="/admin/support-chats" className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-[#27272a] hover:text-white rounded-lg transition-colors group">
              <ShieldAlert className="h-5 w-5 group-hover:text-[#facc15]" />
              Support Chats
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-[#27272a]">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-[#27272a] hover:text-white rounded-lg transition-colors">
            <LogOut className="h-5 w-5" />
            Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#09090b] p-8">
        {children}
      </main>
    </div>
  )
}
