import React from "react"
import { ShieldAlert, Terminal, Lock } from "lucide-react"

export default function MaintenanceScreen() {
  return (
    <div className="flex-1 w-full min-h-[90vh] relative flex items-center justify-center bg-[#030712] overflow-hidden dir-rtl">
      {/* Dynamic Cyber Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #a855f7 1px, transparent 1px),
            linear-gradient(to bottom, #a855f7 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
        }}
      />
      
      {/* V-Pulse overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#00000000] via-[#a855f710] to-[#00f5ff10] animate-pulse z-0 pointer-events-none" />

      {/* Main Content Box */}
      <div className="relative z-10 max-w-lg w-full p-8 mx-4">
        
        {/* Neon Border Container */}
        <div className="relative bg-[#0a0a0c]/90 border border-[#a855f7]/50 rounded-2xl p-10 shadow-[0_0_50px_rgba(168,85,247,0.15)] backdrop-blur-xl overflow-hidden">
          
          {/* Top decorative line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#a855f7] to-transparent" />
          
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            
            {/* Animated Icon */}
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#111114] border-2 border-[#a855f7] shadow-[0_0_30px_#a855f750]">
              <Lock className="w-12 h-12 text-[#00f5ff] animate-pulse" />
              <div className="absolute inset-0 border-[3px] border-transparent border-t-[#00f5ff] rounded-full animate-spin" style={{ animationDuration: '3s' }} />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00f5ff] to-[#a855f7] flex items-center justify-center gap-3">
                <ShieldAlert className="w-8 h-8 text-[#a855f7]" />
                وضع الصيانة الدورية
              </h1>
              <p className="text-[#00f5ff] font-mono text-sm tracking-widest uppercase opacity-80">
                SYSTEM_UNDER_MAINTENANCE_
              </p>
            </div>

            {/* Divider */}
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#27272a] to-transparent my-4" />

            {/* Description */}
            <p className="text-gray-300 text-lg leading-relaxed font-medium">
              نقوم حالياً بتحديث أنظمة <span className="text-[#a855f7] font-bold">Cipher Store</span> لضمان الحماية القصوى لبياناتك ومنع أي تسريب. 
              <br/><br/>
              الموقع متوقف مؤقتاً لجميع العملاء، وسنعود للعمل بكامل طاقتنا قريباً.
            </p>

            {/* Terminal Mock */}
            <div className="w-full bg-[#030712] border border-[#27272a] rounded-lg p-4 mt-6 flex items-start flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="text-left w-full font-mono text-xs text-[#00f5ff] opacity-70">
                <p>&gt; Connection locked by admin...</p>
                <p>&gt; Applying security patches...</p>
                <p className="animate-pulse">&gt; Please standby_</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
