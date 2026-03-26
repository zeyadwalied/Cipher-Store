"use client"

import React from "react"

interface CyberBackgroundBranchesProps {
  primaryColor?: string // e.g., "#a855f7" (Purple)
  secondaryColor?: string // e.g., "#00f5ff" (Cyan)
  accentColor?: string // e.g., "#ffd700" (Gold)
  opacity?: number
  className?: string
  children?: React.ReactNode
}

export function CyberBackgroundBranches({
  primaryColor = "#a855f7",
  secondaryColor = "#00f5ff",
  accentColor = "#ffd700",
  opacity = 0.4,
  className = "",
  children
}: CyberBackgroundBranchesProps) {
  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Background Layer with Colored Spider-Web/Branching Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" style={{ opacity }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-transparent to-[#030712]" />

        {/* Dynamic Branching Lines (SVG for precision) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <defs>
            <filter id="glow-primary">
              <feGaussianBlur stdDeviation="5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-secondary">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Branching Network - Primary */}
          <path
            d="M0,200 L400,450 L1000,300 M400,450 L600,800 L1000,900 M600,800 L300,1000"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.5"
            strokeOpacity="0.4"
            filter="url(#glow-primary)"
            className="animate-pulse"
          />

          {/* Branching Network - Secondary */}
          <path
            d="M1000,100 L700,400 L200,300 M700,400 L500,700 L0,750 M500,700 L800,1000"
            fill="none"
            stroke={secondaryColor}
            strokeWidth="1.5"
            strokeOpacity="0.3"
            filter="url(#glow-secondary)"
            style={{ animationDelay: '1s' }}
            className="animate-pulse"
          />

          {/* Intersections/Nodes */}
          <circle cx="400" cy="450" r="3" fill={primaryColor} className="animate-ping" />
          <circle cx="700" cy="400" r="3" fill={secondaryColor} style={{ animationDelay: '0.5s' }} className="animate-ping" />
          <circle cx="500" cy="700" r="3" fill={accentColor} style={{ animationDelay: '1.5s' }} className="animate-ping" />
        </svg>

        {/* Diagonal Strikes (CSS Gradients) */}
        {/* Strike 1: Top Left to Center */}
        <div
          className="absolute -top-[20%] -left-[20%] w-[150%] h-[1px] rotate-[25deg] shadow-[0_0_30px_5px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
            boxShadow: `0 0 25px ${primaryColor}`,
            opacity: 0.8
          }}
        />

        {/* Strike 2: Bottom Right to Center */}
        <div
          className="absolute -bottom-[20%] -right-[20%] w-[150%] h-[1px] rotate-[25deg] shadow-[0_0_30px_5px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${secondaryColor}, transparent)`,
            boxShadow: `0 0 25px ${secondaryColor}`,
            opacity: 0.7
          }}
        />

        {/* Strike 3: Counter-diagonal Accent (Crossing) */}
        <div
          className="absolute top-[10%] -left-[30%] w-[160%] h-[1px] -rotate-[35deg]"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 20px ${accentColor}`,
            opacity: 0.5
          }}
        />

        {/* Crossing Strike 4: Opposite angle */}
        <div
          className="absolute bottom-[20%] -left-[20%] w-[140%] h-[1px] -rotate-[15deg]"
          style={{
            background: `linear-gradient(90deg, transparent, ${secondaryColor}, transparent)`,
            boxShadow: `0 0 15px ${secondaryColor}`,
            opacity: 0.4
          }}
        />

        {/* Geometric Hexagons/Rhombus */}
        <div
          className="absolute top-1/4 left-1/3 w-64 h-64 border rotate-45 pointer-events-none"
          style={{ borderColor: `${primaryColor}20`, background: `${primaryColor}05` }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 border -rotate-12 pointer-events-none"
          style={{ borderColor: `${secondaryColor}15`, background: `${secondaryColor}03` }}
        />

        {/* Scanning Line */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(255,255,255,0.02)_50%)] bg-[length:100%_4px] pointer-events-none" />
        <div className="cyber-noise opacity-20" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  )
}
