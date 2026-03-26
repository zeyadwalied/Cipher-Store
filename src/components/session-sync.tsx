"use client"

import { useEffect, useRef } from "react"
import { signOut, useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"

const ADMIN_ROLES = ["DEV", "OWNER", "MANAGER", "SELLER", "SUPPORT"]

export default function SessionSync() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const lastDispatchedRole = useRef<string | null>(null)
  const isCheckingRef = useRef(false)

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      lastDispatchedRole.current = null
      return
    }

    let isActive = true

    const syncNow = async () => {
      if (!isActive || isCheckingRef.current) return
      isCheckingRef.current = true

      try {
        const res = await fetch("/api/auth/sync", { cache: "no-store" })
        if (!res.ok) return

        const data = await res.json()
        if (!isActive) return

        if (!data.authenticated || data.isBlocked) {
          await signOut({ callbackUrl: "/login?error=SessionExpired" })
          return
        }

        if (data.role !== lastDispatchedRole.current) {
          window.dispatchEvent(new CustomEvent("sync-role", { detail: data.role }))
          lastDispatchedRole.current = data.role
        }

        if (
          data.role !== session.user.role ||
          data.isBlocked !== session.user.isBlocked
        ) {
          await update({ role: data.role, isBlocked: data.isBlocked })
        }

        if (pathname.startsWith("/admin") && !ADMIN_ROLES.includes(data.role)) {
          router.replace("/dashboard")
          router.refresh()
          return
        }

        if (!pathname.startsWith("/admin") && data.role !== session.user.role) {
          router.refresh()
        }
      } catch (error) {
        console.error("Session sync failed:", error)
      } finally {
        isCheckingRef.current = false
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncNow()
      }
    }

    const onWindowFocus = () => {
      void syncNow()
    }

    const interval = window.setInterval(() => {
      void syncNow()
    }, 2000)

    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("focus", onWindowFocus)
    window.addEventListener("pageshow", onWindowFocus)

    void syncNow()

    return () => {
      isActive = false
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("focus", onWindowFocus)
      window.removeEventListener("pageshow", onWindowFocus)
    }
  }, [
    pathname,
    router,
    session?.user?.id,
    session?.user?.isBlocked,
    session?.user?.role,
    status,
    update,
  ])

  return null
}
