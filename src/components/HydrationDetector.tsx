"use client"

import { useEffect } from "react"

export function HydrationDetector() {
    useEffect(() => {
        // Dispatch an event to signal to the CyberLoader that React hydration is complete
        document.dispatchEvent(new CustomEvent("react-hydrated"))
    }, [])

    return null
}
