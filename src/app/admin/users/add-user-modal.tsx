"use client"

import { useState } from "react"
import { UserPlus, X, Loader2 } from "lucide-react"

export default function AddUserModal({ onUserAdded }: { onUserAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setIsOpen(false)
        setFormData({ name: "", email: "", password: "", role: "USER" })
        onUserAdded() // Refresh the page to show new user
      } else {
        const err = await res.text()
        alert(`Error creating user: ${err}`)
      }
    } catch (e) {
      console.error(e)
      alert("Failed to create user.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#a855f7] hover:bg-[#9333ea] text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        <UserPlus className="h-5 w-5" /> Add New User
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#141417] border border-[#27272a] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#a855f7]" /> Create User Account
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a855f7]"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a855f7]"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Initial Password</label>
                <input 
                  type="text" 
                  required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a855f7]"
                  placeholder="Secure password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Account Role</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#a855f7]"
                >
                  <option value="USER">Customer (USER)</option>
                  <option value="SUPPORT">Support Team (SUPPORT)</option>
                  <option value="SELLER">Store Seller (SELLER)</option>
                  <option value="MANAGER">Store Manager (MANAGER)</option>
                  <option value="OWNER">Platform Owner (OWNER)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Defines what this user can access in the admin panel.</p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
