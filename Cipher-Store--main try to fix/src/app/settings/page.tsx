"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { User, Lock, Save, Camera, Eye, EyeOff, ShieldAlert, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [name, setName] = useState(session?.user?.name || "")
  const [image, setImage] = useState(session?.user?.image || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })

  const isAdmin = ["OWNER", "MANAGER", "SELLER", "SUPPORT"].includes(session?.user?.role as string)
  const [selectedRole, setSelectedRole] = useState(session?.user?.role || "USER")
  const [showRoleDialog, setShowRoleDialog] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ text: "", type: "" })

    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image })
      })

      if (res.ok) {
        setMessage({ text: "Profile updated successfully!", type: "success" })
        // Force session update so the navbar reflects the new name/image
        await update({ name, image })
      } else {
        setMessage({ text: await res.text(), type: "error" })
      }
    } catch (e) {
      setMessage({ text: "Something went wrong.", type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setMessage({ text: "Password must be at least 6 characters.", type: "error" })
      return
    }

    setIsLoading(true)
    setMessage({ text: "", type: "" })

    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      if (res.ok) {
        setMessage({ text: "Password changed successfully!", type: "success" })
        setCurrentPassword("")
        setNewPassword("")
      } else {
        setMessage({ text: await res.text(), type: "error" })
      }
    } catch (e) {
      setMessage({ text: "Something went wrong.", type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateRole = async () => {
    setIsLoading(true)
    setShowRoleDialog(false)
    setMessage({ text: "", type: "" })

    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole })
      })

      if (res.ok) {
        setMessage({ text: "Role updated successfully! Reloading...", type: "success" })
        // Force session update and reload page
        await update({ role: selectedRole })
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMessage({ text: await res.text(), type: "error" })
      }
    } catch (e) {
      setMessage({ text: "Something went wrong.", type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <User className="h-8 w-8 text-[#a855f7]" /> Account Settings
      </h1>

      {message.text && (
        <div className={`mb-8 p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Profile Info */}
        <div className="bg-[#141417] border border-[#27272a] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-[#27272a] pb-4">Profile Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-6">

            <div className="flex items-center gap-6">
              <div className="relative h-20 w-20 rounded-full bg-[#27272a] flex items-center justify-center overflow-hidden shrink-0 border-2 border-[#a855f7]/30">
                {image ? (
                  <img src={image} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-gray-400" />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-1 flex justify-center backdrop-blur-sm">
                  <Camera className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-400 mb-2">Avatar Image URL</label>
                <input
                  type="url"
                  value={image}
                  onChange={e => setImage(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a855f7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a855f7]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <input
                type="email"
                value={session?.user?.email || ""}
                disabled
                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-2">Connecting a different email is currently not supported.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Save Profile
            </button>
          </form>
        </div>

        {/* Security Info */}
        <div className="bg-[#141417] border border-[#27272a] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-[#27272a] pb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#a855f7]" /> Password & Security
          </h2>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a855f7] pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">New Password (Min. 6 chars)</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a855f7] pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#27272a] hover:bg-[#3f3f46] text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              Change Password
            </button>
          </form>
        </div>

        {/* Role Management (Admins Only) */}
        {isAdmin && (
          <div className="bg-[#141417] border border-[#27272a] rounded-xl p-6 relative overflow-hidden">
            {/* Glowing Accent */}
            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-red-500 to-orange-500" />
            
            <h2 className="text-xl font-bold text-white mb-6 border-b border-[#27272a] pb-4 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" /> Role & Permissions
            </h2>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#09090b] p-4 rounded-lg border border-[#27272a]">
              <div>
                <p className="text-sm font-bold text-white mb-1">Account Role</p>
                <p className="text-xs text-gray-500">Change your active management permissions.</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select 
                  disabled={isLoading} 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="bg-[#141417] text-xs font-bold px-3 py-2 sm:py-2.5 flex-1 sm:flex-none rounded-lg border outline-none cursor-pointer transition-all text-gray-300 border-[#27272a] hover:border-red-500/50 focus:border-red-500 disabled:opacity-50"
                  dir="ltr"
                >
                  <option value="USER">USER</option>
                  <option value="SUPPORT">SUPPORT</option>
                  <option value="SELLER">SELLER</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="OWNER">OWNER</option>
                </select>
                <button
                  onClick={() => setShowRoleDialog(true)}
                  disabled={isLoading || selectedRole === session?.user?.role}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 sm:py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-[0_0_10px_rgba(239,68,68,0.2)] hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showRoleDialog && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRoleDialog(false)} />
          <div className="relative bg-[#141417] border border-[#27272a] rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200" dir="rtl">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">تأكيد تغيير الرتبة</h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                هل أنت متأكد أنك تريد تغيير رتبتك إلى <strong className="text-red-400 font-mono tracking-wider">{selectedRole}</strong>؟ 
                <br/><br/>
                سيؤدي هذا لتغيير صلاحياتك في لوحة التحكم وتحديث الصفحة فوراً.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleUpdateRole}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" /> نعم، متأكد
                </button>
                <button
                  onClick={() => setShowRoleDialog(false)}
                  className="flex-1 bg-[#27272a] hover:bg-[#3f3f46] text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <XCircle className="h-4 w-4" /> إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
