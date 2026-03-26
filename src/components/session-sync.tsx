"use client"

import { useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useRef } from "react"

export default function SessionSync() {
    const { data: session, status, update } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const lastDispatchedRole = useRef<string | null>(null)

    useEffect(() => {
        if (status !== "authenticated" || !session?.user) return
        
        let isUpdating = false;

        const checkSync = async () => {
            if (isUpdating) return;
            try {
                const res = await fetch("/api/auth/sync")
                if (res.ok) {
                    const data = await res.json()

                    if (!data.authenticated || data.isBlocked) {
                        console.log("SessionSync: User blocked or deleted, signing out...")
                        signOut({ callbackUrl: "/login?error=Blocked" })
                        return
                    }

                    // Only dispatch if role actually changed or first time
                    if (data.role !== lastDispatchedRole.current) {
                        window.dispatchEvent(new CustomEvent('sync-role', { detail: data.role }))
                        lastDispatchedRole.current = data.role
                    }

                    // Check for role mismatch with current SESSION for internal auth update
                    if (data.role !== (session.user as any).role) {
                        isUpdating = true;
                        await update()
                        
                        // ONLY force a hard redirect if the user is currently on an admin page
                        if (pathname.startsWith("/admin") && data.role === "USER") {
                            console.warn("SessionSync: Admin access revoked while on admin page! Kicking out...")
                            window.location.href = "/" 
                            return
                        }
                        
                        setTimeout(() => { isUpdating = false; }, 2000);
                    }
                }
            } catch (e) {
                console.error("Sync check failed", e)
            }
        }

        // Check once every 15 seconds for role/block changes (Security Hardened & Performance Optimized)
        const interval = setInterval(checkSync, 15000)

        // Also check on mount
        checkSync()

        return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return null
}
