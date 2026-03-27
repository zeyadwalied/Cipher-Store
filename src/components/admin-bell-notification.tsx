"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell, Package, X, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function AdminBellNotification() {
  const [count, setCount] = useState(0)
  const [orders, setOrders] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewOrder, setHasNewOrder] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const lastCountRef = useRef<number | null>(null) // null = first fetch (silent)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Initialise AudioContext on first user click (browser autoplay policy)
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    // Re-resume if browser suspended it
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume()
    }
  }, [])

  const playNotificationSound = useCallback(() => {
    try {
      const ctx = audioCtxRef.current
      if (!ctx) return

      const playTone = (freq: number, startAt: number, duration: number, gain: number) => {
        const osc = ctx.createOscillator()
        const gainNode = ctx.createGain()
        osc.connect(gainNode)
        gainNode.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt)
        gainNode.gain.setValueAtTime(0, ctx.currentTime + startAt)
        gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + startAt + 0.05)
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration)
        osc.start(ctx.currentTime + startAt)
        osc.stop(ctx.currentTime + startAt + duration + 0.05)
      }

      playTone(880,  0,    0.35, 0.5)
      playTone(1100, 0.18, 0.45, 0.35)
    } catch (e) {
      console.warn("Audio notification failed:", e)
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications")
      if (!res.ok) return
      const data = await res.json()
      const newCount: number = data.count

      setOrders(data.orders)
      setCount(newCount)

      // Skip comparison on very first fetch (lastCountRef is null)
      if (lastCountRef.current !== null && newCount > lastCountRef.current) {
        setHasNewOrder(true)
        playNotificationSound()
        setTimeout(() => setHasNewOrder(false), 6000)
      }

      lastCountRef.current = newCount
    } catch { /* silently fail */ }
  }, [playNotificationSound])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleBellClick = () => {
    initAudio()          // Wake up AudioContext on user gesture
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* New Order Toast Banner */}
      {hasNewOrder && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-[#a855f7] text-white px-6 py-3 rounded-2xl shadow-2xl shadow-[#a855f7]/30 animate-bounce pointer-events-auto">
          <Package className="h-5 w-5 shrink-0" />
          <span className="font-bold text-sm">🎉 هناك طلب جديد!</span>
          <button onClick={() => setHasNewOrder(false)} aria-label="Dismiss new order notification" title="Dismiss" className="ml-2 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Bell Button */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={handleBellClick}
          aria-label={`Order notifications${count > 0 ? `, ${count} pending orders` : ""}`}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className="relative flex items-center justify-center text-gray-300 hover:text-[#a855f7] transition-colors"
          title="Order Notifications"
        >
          <Bell className={`h-5 w-5 ${count > 0 ? "text-[#a855f7] animate-[wiggle_1s_ease-in-out_infinite]" : ""}`} />
          {count > 0 && (
            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#a855f7] text-[10px] font-black text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-3 w-80 bg-[#141417] border border-[#27272a] rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#27272a] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="h-4 w-4 text-[#a855f7]" />
                Pending Orders
                {count > 0 && (
                  <span className="bg-[#a855f7] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{count}</span>
                )}
              </h3>
              <button onClick={() => setIsOpen(false)} aria-label="Close notifications panel" title="Close notifications" className="text-gray-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-[#27272a]">
              {orders.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No pending orders
                </div>
              ) : orders.map(order => (
                <Link
                  key={order.id}
                  href="/admin/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-[#27272a] transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-yellow-500/15 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold leading-tight truncate">
                      {order.user?.name || "Customer"}
                    </p>
                    <p className="text-gray-500 text-xs truncate">
                      {order.items?.[0]?.product?.name} • {order.total?.toFixed(2)} EGP
                    </p>
                    <p className="text-[10px] text-yellow-500/80 mt-0.5 font-bold uppercase">PENDING</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-[#27272a]">
              <Link
                href="/admin/orders"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 text-sm text-[#a855f7] hover:text-[#c084fc] font-semibold transition-colors"
              >
                View All Orders <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
