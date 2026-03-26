"use client"

import { useRef, useEffect, useState } from "react"

export function ScrollAnimationWrapper({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      suppressHydrationWarning
      style={{
        opacity: !mounted || isVisible ? 1 : 0,
        transform: !mounted || isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
        willChange: 'opacity, transform'
      }}
    >
      {children}
    </div>
  )
}
