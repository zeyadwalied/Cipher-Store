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
    <section className="relative overflow-hidden py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#030712]" />
        <div className="absolute top-24 left-[-10%] h-px w-[65%] rotate-[18deg] bg-gradient-to-r from-transparent via-[#00f5ff]/55 to-transparent shadow-[0_0_12px_rgba(0,245,255,0.35)]" />
        <div className="absolute top-40 right-[-10%] h-px w-[70%] -rotate-[18deg] bg-gradient-to-l from-transparent via-[#a855f7]/45 to-transparent shadow-[0_0_12px_rgba(168,85,247,0.3)]" />
        <div className="absolute bottom-32 left-[-5%] h-px w-[55%] -rotate-[8deg] bg-gradient-to-r from-transparent via-[#00f5ff]/30 to-transparent" />
        <div className="absolute bottom-20 right-0 h-px w-[45%] rotate-[12deg] bg-gradient-to-l from-transparent via-[#a855f7]/30 to-transparent" />
        <div className="absolute left-1/2 top-32 h-[360px] w-[360px] -translate-x-1/2 rotate-45 border border-[#00f5ff]/5" />
        <div className="absolute left-1/2 top-52 h-[280px] w-[280px] -translate-x-1/2 rotate-45 border border-[#a855f7]/10" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#00f5ff]/[0.03] to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-10 flex max-w-5xl items-center gap-4 border-b border-[#27272a] pb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#a855f7]/30 bg-[#a855f7]/10 shadow-[0_0_30px_rgba(168,85,247,0.12)]">
            <User className="h-7 w-7 text-[#a855f7]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white font-cyber tracking-wide">Account Settings</h1>
            <p className="mt-1 text-sm text-gray-400 font-mono">Manage your profile, security, and account permissions.</p>
          </div>
        </div>

        {message.text && (
          <div className={`mx-auto mb-8 max-w-5xl rounded-2xl border px-5 py-4 shadow-lg ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <div className="mx-auto grid max-w-5xl gap-8 xl:grid-cols-[1.2fr_0.9fr]">
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-3xl border border-[#27272a] bg-[#141417]/95 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.2)] sm:p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00f5ff]/60 to-transparent" />
              <h2 className="mb-6 flex items-center gap-3 border-b border-[#27272a] pb-4 text-xl font-bold text-white">
                <User className="h-5 w-5 text-[#00f5ff]" />
                Profile Information
              </h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
                  <div className="relative h-24 w-24 rounded-[28px] bg-[#09090b] flex items-center justify-center overflow-hidden shrink-0 border border-[#a855f7]/30 shadow-[0_0_25px_rgba(168,85,247,0.12)]">
                    {image ? (
                      <img src={image} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-11 w-11 text-gray-400" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center bg-black/55 py-1.5 backdrop-blur-sm">
                      <Camera className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Avatar Image URL</label>
                      <input
                        type="url"
                        value={image}
                        onChange={e => setImage(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full rounded-2xl border border-[#27272a] bg-[#09090b] px-4 py-3 text-white transition-colors focus:border-[#00f5ff] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Display Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="w-full rounded-2xl border border-[#27272a] bg-[#09090b] px-4 py-3 text-white transition-colors focus:border-[#a855f7] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Email Address</label>
                  <input
                    type="email"
                    value={session?.user?.email || ""}
                    disabled
                    className="w-full cursor-not-allowed rounded-2xl border border-[#27272a] bg-[#09090b] px-4 py-3 text-gray-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">Connecting a different email is currently not supported.</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#a855f7] px-6 py-3 font-bold text-white transition-colors hover:bg-[#9333ea] disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> Save Profile
                </button>
              </form>
            </div>

            {isAdmin && (
              <div className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-[#141417]/95 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.2)] sm:p-8">
                <div className="absolute top-0 right-0 h-full w-px bg-gradient-to-b from-transparent via-red-500 to-transparent" />
                <h2 className="mb-6 flex items-center gap-3 border-b border-[#27272a] pb-4 text-xl font-bold text-white">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                  Role & Permissions
                </h2>

                <div className="flex flex-col gap-5 rounded-2xl border border-[#27272a] bg-[#09090b]/80 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-md">
                    <p className="mb-1 text-base font-bold text-white">Account Role</p>
                    <p className="text-sm text-gray-400">Change your active management permissions from the current session.</p>
                  </div>
                  <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                    <select
                      disabled={isLoading}
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="rounded-2xl border border-[#27272a] bg-[#141417] px-4 py-3 text-sm font-bold text-gray-300 outline-none transition-all hover:border-red-500/40 focus:border-red-500 disabled:opacity-50"
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
                      className="whitespace-nowrap rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-3xl border border-[#27272a] bg-[#141417]/95 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.2)] sm:p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a855f7]/60 to-transparent" />
              <h2 className="mb-6 flex items-center gap-3 border-b border-[#27272a] pb-4 text-xl font-bold text-white">
                <Lock className="h-5 w-5 text-[#a855f7]" />
                Password & Security
              </h2>
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div>
                  <label className="mb-2 block text-xs font-mono uppercase tracking-[0.2em] text-gray-400">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      required
                      className="w-full rounded-2xl border border-[#27272a] bg-[#09090b] px-4 py-3 pr-12 text-white transition-colors focus:border-[#a855f7] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-white"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-mono uppercase tracking-[0.2em] text-gray-400">New Password (Min. 6 chars)</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-2xl border border-[#27272a] bg-[#09090b] px-4 py-3 pr-12 text-white transition-colors focus:border-[#a855f7] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-white"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#27272a] px-6 py-3 font-bold text-white transition-colors hover:bg-[#3f3f46] disabled:opacity-50"
                >
                  Change Password
                </button>
              </form>
            </div>
          </div>
        </div>
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
    </section>
  )
}
