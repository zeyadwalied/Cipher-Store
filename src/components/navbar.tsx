"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingCart, Menu, Search, User, LogOut, Package, Gamepad2, MessageSquare, Loader2 } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useCartStore } from "@/lib/store"
import { useState, useEffect, useRef } from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import AdminBellNotification from "@/components/admin-bell-notification"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function Navbar() {
  const { data: session, status } = useSession()
  const items = useCartStore((state) => state.items)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [categories, setCategories] = useState<{ id: string, name: string, slug?: string | null, imageUrl?: string | null, parentId: string | null, children?: { id: string, name: string, slug?: string | null, imageUrl?: string | null }[] }[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const hasSyncedFromDB = useRef(false)

  useEffect(() => {
    setIsMounted(true)

    // Initialize role from session ONLY if we haven't synced from DB yet
    if (session?.user && !hasSyncedFromDB.current) {
      setCurrentUserRole((session.user as any).role)
    }

    // Listen for real-time role updates from SessionSync
    const handleSyncRole = (e: any) => {
      setCurrentUserRole(e.detail)
      hasSyncedFromDB.current = true
    }
    window.addEventListener('sync-role', handleSyncRole)
    if (isMounted) {
      fetch('/api/categories').then(r => r.json()).then(data => {
        if (Array.isArray(data)) setCategories(data)
      }).catch(err => {
        // Silent catch for initial aborted/failed fetches
      })
    }

    return () => {
      window.removeEventListener('sync-role', handleSyncRole)
    }
  }, [session])

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0)

  // Filter for top-level categories only for the main navbar list
  const mainCategories = categories.filter(cat => !cat.parentId)

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#27272a] bg-[#09090b]/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center text-xl font-bold tracking-tighter text-white shrink-0" dir="ltr">
          <img
            src="/favicon.ico.png"
            alt="Cipher Store"
            className="h-10 md:h-14 w-auto object-contain drop-shadow-[0_0_12px_rgba(0,245,255,0.6)] z-20"
          />
          <span className="font-cyber bg-gradient-to-r from-[#00f5ff] to-[#a855f7] bg-clip-text text-transparent tracking-wider text-base md:text-xl -ml-2 sm:-ml-3 mt-1">
            ipher Store
          </span>
        </Link>

        {/* Desktop Nav - Centered with Dropdowns */}
        <div className="hidden md:flex flex-1 justify-center items-center gap-2">
          {mainCategories.slice(0, 5).map((cat) => (
            <div key={cat.id} className="relative group">
              <Link
                href={`/category/${cat.slug || cat.id}`}
                className="btn-cyber-outline px-4 py-2 text-[11px] tracking-widest border-[#00f5ff]/20 text-gray-400 hover:text-[#00f5ff] hover:border-[#00f5ff]/60 transition-all shrink-0 flex items-center justify-center min-w-[100px] gap-2"
              >
                {cat.imageUrl && (
                  <img src={cat.imageUrl} alt="" className="h-5 w-5 rounded object-cover border border-[#00f5ff]/20" />
                )}
                {cat.name}
                {cat.children && cat.children.length > 0 && <span className="text-[8px] opacity-40">▼</span>}
              </Link>

              {/* Dropdown Menu */}
              {cat.children && cat.children.length > 0 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="bg-[#09090b]/95 backdrop-blur-xl border border-[#00f5ff]/30 rounded-xl overflow-hidden min-w-[200px] shadow-[0_10px_40px_rgba(0,245,255,0.15)]">
                    <div className="py-2">
                      {cat.children.map(sub => (
                        <Link
                          key={sub.id}
                          href={`/category/${sub.slug || sub.id}`}
                          className="flex items-center gap-3 px-5 py-2.5 text-gray-400 hover:text-[#00f5ff] hover:bg-[#00f5ff]/5 transition-colors border-b border-white/5 last:border-0"
                        >
                          {sub.imageUrl ? (
                            <img src={sub.imageUrl} alt="" className="h-6 w-6 rounded object-cover border border-[#00f5ff]/20 shrink-0" />
                          ) : (
                            <div className="h-6 w-6 rounded bg-[#141417] border border-[#27272a] shrink-0" />
                          )}
                          <span className="text-[10px] tracking-widest uppercase font-mono">{sub.name}</span>
                        </Link>
                      ))}
                    </div>
                    {/* Bottom accent line */}
                    <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#00f5ff] to-transparent opacity-50" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions Search & Cart */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <form action="/search" method="GET" className="hidden lg:flex items-center relative max-w-xs w-full">
            <input
              type="text"
              name="q"
              placeholder="ابحث عن الألعاب، البطاقات..."
              className="w-full bg-[#141417]/60 backdrop-blur-md border border-[#00f5ff]/20 rounded-full pl-4 pr-10 py-1.5 text-sm text-white focus:outline-none focus:border-[#00f5ff] focus:ring-1 focus:ring-[#00f5ff]/20 transition-all text-right"
              dir="rtl"
            />
            <Search className="h-4 w-4 text-[#00f5ff]/60 absolute right-3 top-1/2 -translate-y-1/2" />
          </form>

          <Link href="/search" className="lg:hidden text-gray-300 hover:text-[#00f5ff] transition-colors">
            <Search className="h-5 w-5" />
          </Link>

          <Link href="/cart" className="relative text-gray-300 hover:text-[#00f5ff] transition-all hover:drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]">
            <ShoppingCart className="h-5 w-5" />
            {(isMounted && cartItemCount > 0) && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#00f5ff] text-[10px] font-bold text-black shadow-[0_0_10px_rgba(0,245,255,0.5)]">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* Bell — only for admin roles */}
          {session && ["OWNER", "MANAGER"].includes(currentUserRole || "") && (
            <div className="hover:drop-shadow-[0_0_8px_rgba(0,245,255,0.6)] transition-all">
              <AdminBellNotification />
            </div>
          )}

          {status === "loading" ? (
            <div className="h-8 w-24 sm:h-9 sm:w-28 bg-[#a855f7]/20 rounded-lg animate-pulse" />
          ) : session ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-[#00f5ff]/20 bg-[#141417]/80 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:border-[#00f5ff]/60 hover:shadow-[0_0_15px_rgba(0,245,255,0.1)] transition-all"
              >
                <User className="h-4 w-4 text-[#00f5ff]" />
                <span className="hidden sm:inline-block">{session.user?.name || "المستخدم"}</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 flex-col overflow-hidden rounded-xl border border-[#27272a] bg-[#141417] shadow-xl flex z-50 text-right" dir="rtl">
                  <div className="px-4 py-3 border-b border-[#27272a]">
                    <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
                  </div>
                  {["OWNER", "MANAGER", "SELLER", "SUPPORT"].includes(currentUserRole || "") && (
                    <Link
                      href="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#27272a] hover:text-white"
                    >
                      <Package className="h-4 w-4 ml-2" />
                      لوحة الإدارة
                    </Link>
                  )}
                  <Link href="/chat" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#27272a] hover:text-white">
                    <MessageSquare className="h-4 w-4 ml-2" />
                    الرسائل
                  </Link>
                  <Link href="/orders" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#27272a] hover:text-white">
                    <Package className="h-4 w-4 ml-2" />
                    طلباتي
                  </Link>
                  <Link href="/settings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#27272a] hover:text-white">
                    <User className="h-4 w-4 ml-2" />
                    الإعدادات
                  </Link>
                  <button
                    onClick={() => {
                      setIsLoggingOut(true)
                      signOut({ callbackUrl: '/' })
                    }}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 disabled:opacity-50 transition-opacity"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4 ml-2" />
                    )}
                    {isLoggingOut ? "جاري الخروج..." : "تسجيل الخروج"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-[#a855f7] px-2.5 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-white transition-all hover:bg-[#9333ea]"
            >
              تسجيل الدخول
            </Link>
          )}

          {/* Mobile Menu Toggle — Cyberpunk Styled */}
          <button
            className={`md:hidden relative p-2 rounded-lg border transition-all duration-300 ${isMobileMenuOpen
                ? 'border-[#00f5ff] bg-[#00f5ff]/10 text-[#00f5ff] shadow-[0_0_15px_rgba(0,245,255,0.3)]'
                : 'border-[#27272a] text-gray-400 hover:text-[#00f5ff] hover:border-[#00f5ff]/40 hover:shadow-[0_0_10px_rgba(0,245,255,0.15)]'
              }`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="flex flex-col items-center justify-center w-5 h-5 gap-[5px]">
              <span className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 scale-0' : ''}`} />
              <span className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Nav — Cyberpunk Theme */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#00f5ff]/20 bg-[#0a0a0f]/95 backdrop-blur-xl relative overflow-hidden">
          {/* Cyber Scanlines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(0,245,255,0.1) 50%)', backgroundSize: '100% 4px' }} />
          {/* Corner Accents */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#00f5ff]/40" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#a855f7]/40" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#a855f7]/40" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#00f5ff]/40" />

          <div className="px-4 py-4 space-y-1 relative z-10">
            {/* Header line */}
            <div className="flex items-center gap-2 mb-3 px-2">
              <div className="h-[2px] flex-1 bg-gradient-to-r from-[#00f5ff]/50 to-transparent" />
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#00f5ff]/60">CATEGORIES</span>
              <div className="h-[2px] flex-1 bg-gradient-to-l from-[#a855f7]/50 to-transparent" />
            </div>

            {mainCategories.map((cat) => (
              <div key={cat.id}>
                <Link
                  href={`/category/${cat.slug || cat.id}`}
                  className="flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold text-white/90 hover:text-[#00f5ff] hover:bg-[#00f5ff]/5 border border-transparent hover:border-[#00f5ff]/20 transition-all duration-300 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt="" className="h-8 w-8 rounded-lg object-cover border border-[#00f5ff]/20 group-hover:border-[#00f5ff]/50 group-hover:shadow-[0_0_10px_rgba(0,245,255,0.2)] transition-all" />
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-[#141417] border border-[#27272a] flex items-center justify-center">
                      <Gamepad2 className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                  <span className="flex-1">{cat.name}</span>
                  <span className="text-[10px] text-[#00f5ff]/30 font-mono group-hover:text-[#00f5ff]/60 transition-colors">▸</span>
                </Link>
                {/* Subcategories */}
                {cat.children && cat.children.length > 0 && (
                  <div className="mr-8 border-r border-[#00f5ff]/10 pr-3 mb-1 space-y-0.5">
                    {cat.children.map(sub => (
                      <Link
                        key={sub.id}
                        href={`/category/${sub.id}`}
                        className="flex items-center gap-2 py-2 px-3 rounded-lg text-xs text-gray-500 hover:text-[#a855f7] hover:bg-[#a855f7]/5 transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {sub.imageUrl ? (
                          <img src={sub.imageUrl} alt="" className="h-5 w-5 rounded object-cover border border-[#27272a]" />
                        ) : (
                          <div className="h-5 w-5 rounded bg-[#09090b] border border-[#27272a]" />
                        )}
                        <span className="font-mono tracking-wide">{sub.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Bottom accent */}
            <div className="h-[1px] mt-3 bg-gradient-to-r from-transparent via-[#00f5ff]/30 to-transparent" />
          </div>
        </div>
      )}
    </nav>
  )
}
