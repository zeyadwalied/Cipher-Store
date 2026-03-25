"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { User, Lock, Save, Camera, Eye, EyeOff } from "lucide-react"

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
      </div>
    </div>
  )
}
