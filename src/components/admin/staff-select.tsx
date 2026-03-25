"use client"

import { useState, useRef, useEffect } from "react"
import { User, ChevronDown, Check } from "lucide-react"

interface StaffUser {
    id: string
    name: string
    role: string
}

interface StaffSelectProps {
    value: string | null
    staff: StaffUser[]
    onChange: (id: string | null) => void
    disabled?: boolean
}

export default function StaffSelect({ value, staff, onChange, disabled }: StaffSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedStaff = staff.find(s => s.id === value)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center gap-2 bg-[#09090b] border border-[#27272a] rounded-lg px-2 py-1 min-w-[120px] text-[10px] font-bold text-gray-300 transition-all hover:border-[#a855f7]/50 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
                <User className="h-3 w-3 text-gray-400" />
                <span className="flex-1 text-left truncate">
                    {selectedStaff ? selectedStaff.name : "Unassigned"}
                </span>
                <ChevronDown className={`h-3 w-3 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-[160px] bg-[#141417] border border-[#27272a] rounded-lg shadow-2xl z-[100] py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <button
                        type="button"
                        onClick={() => {
                            onChange(null)
                            setIsOpen(false)
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-gray-400 hover:bg-[#27272a] hover:text-white transition-colors"
                    >
                        <span>Unassigned</span>
                        {!value && <Check className="h-3 w-3 text-[#a855f7]" />}
                    </button>

                    <div className="h-[1px] bg-[#27272a] my-1" />

                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                        {staff.map(s => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                    onChange(s.id)
                                    setIsOpen(false)
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-gray-400 hover:bg-[#27272a] hover:text-white transition-colors text-left"
                            >
                                <div className="flex flex-col">
                                    <span className={value === s.id ? "text-[#a855f7]" : ""}>{s.name}</span>
                                    <span className="text-[8px] text-gray-500 opacity-70 uppercase tracking-tighter">{s.role}</span>
                                </div>
                                {value === s.id && <Check className="h-3 w-3 text-[#a855f7]" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
