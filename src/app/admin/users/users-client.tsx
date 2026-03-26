"use client"

import { useState } from "react"
import { Users, Search, ShieldAlert, Loader2, Ban, UserCheck, Trash2 } from "lucide-react"
import AddUserModal from "./add-user-modal"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function UsersClient({ initialUsers, currentUser }: { initialUsers: any[], currentUser: any }) {
    const [users, setUsers] = useState(initialUsers)
    const [searchTerm, setSearchTerm] = useState("")
    const [isUpdating, setIsUpdating] = useState<string | null>(null)
    const [isBlocking, setIsBlocking] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'active' | 'blocked'>('active')
    const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({})
    const router = useRouter()
    const { update } = useSession()
    const canAssignOwner = currentUser.role === "OWNER"
    const adminRoles = ["OWNER", "MANAGER", "SELLER", "SUPPORT"]

    const handleRoleChange = (userId: string, newRole: string) => {
        setPendingRoles(prev => ({ ...prev, [userId]: newRole }))
    }

    const submitRoleUpdate = async (userId: string) => {
        const newRole = pendingRoles[userId]
        if (!newRole) return

        const isSelf = userId === currentUser.id
        const message = isSelf 
            ? `WARNING: You are about to change YOUR OWN role to ${newRole}. This may immediately restrict your access to this page. Do you want to proceed?`
            : `Are you sure you want to change this user's role to ${newRole}?`

        if (!confirm(message)) return

        setIsUpdating(userId)
        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole })
            })

            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
                
                // Clear pending state
                const newPending = { ...pendingRoles }
                delete newPending[userId]
                setPendingRoles(newPending)

                if (isSelf) {
                    const syncRes = await fetch("/api/auth/sync", { cache: "no-store" })
                    const syncData = await syncRes.json().catch(() => null)

                    if (syncData?.authenticated) {
                        window.dispatchEvent(new CustomEvent("sync-role", { detail: syncData.role }))
                        await update({ role: syncData.role, isBlocked: syncData.isBlocked })
                    }

                    const nextRole = syncData?.role || newRole
                    if (!adminRoles.includes(nextRole)) {
                        router.replace("/dashboard")
                        router.refresh()
                        return
                    }
                }
                
                router.refresh()
            } else {
                alert("Failed to update role")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsUpdating(null)
        }
    }

    const handleBlockToggle = async (userId: string, currentStatus: boolean) => {
        if (userId === currentUser.id) return
        if (!confirm(`Are you sure you want to ${currentStatus ? 'Unblock' : 'Block'} this user?`)) return

        setIsBlocking(userId)
        try {
            const res = await fetch(`/api/admin/users/${userId}/block`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isBlocked: !currentStatus })
            })

            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: !currentStatus } : u))
                router.refresh()
            } else {
                alert("Failed to update status")
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsBlocking(null)
        }
    }

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (userId === currentUser.id) return
        if (!confirm(`WARNING: Are you sure you want to PERMANENTLY delete user "${userName}"?\nThis action cannot be undone.`)) return

        setIsDeleting(userId)
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE",
            })

            const data = await res.json().catch(() => null)

            if (res.ok) {
                setUsers(users.filter(u => u.id !== userId))
                router.refresh()
            } else {
                alert(data?.error || "Failed to delete user")
            }
        } catch (e: any) {
            console.error(e)
            alert(e.message || "An unexpected error occurred")
        } finally {
            setIsDeleting(null)
        }
    }

    const filteredUsers = users.filter(u => {
        const matchesSearch = (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        
        if (activeTab === 'blocked') return matchesSearch && u.isBlocked === true
        return matchesSearch && !u.isBlocked
    })

    return (
        <div className="max-w-6xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Users className="h-8 w-8 text-green-500" /> Manage Users
                </h1>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#141417] border border-[#27272a] rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[#a855f7]"
                        />
                    </div>
                    <AddUserModal onUserAdded={() => router.refresh()} />
                </div>
            </div>

            <div className="flex items-center gap-6 mb-6 border-b border-[#27272a]">
                <button 
                    onClick={() => setActiveTab('active')}
                    className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'active' ? 'text-[#00f5ff]' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    Active Users
                    {activeTab === 'active' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-[#00f5ff] shadow-[0_0_8px_#00f5ff]" />}
                </button>
                <button 
                    onClick={() => setActiveTab('blocked')}
                    className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'blocked' ? 'text-red-500' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    Blocked Users
                    {activeTab === 'blocked' && <div className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-red-500 shadow-[0_0_8px_red]" />}
                </button>
            </div>

            <div className="bg-[#141417] border border-[#27272a] rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#09090b] border-b border-[#27272a]">
                        <tr className="text-gray-400 text-sm">
                            <th className="px-6 py-4 font-medium">User Name</th>
                            <th className="px-6 py-4 font-medium">Email</th>
                            <th className="px-6 py-4 font-medium">Joined Date</th>
                            <th className="px-6 py-4 font-medium text-right">Role</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">
                                    {searchTerm ? `No users matching "${searchTerm}"` : "No users found."}
                                </td>
                            </tr>
                        ) : filteredUsers.map((user: any) => (
                            <tr key={user.id} className={`border-b border-[#27272a] hover:bg-[#27272a]/20 transition-colors ${user.isBlocked ? 'opacity-60 grayscale' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="text-white font-medium">{user.name || "Unknown"}</div>
                                        {user.isBlocked && <span className="bg-red-500/20 text-red-500 text-[10px] px-1.5 py-0.5 rounded border border-red-500/30 font-bold">BLOCKED</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-300">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 text-gray-400">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        {isUpdating === user.id && <Loader2 className="h-4 w-4 text-[#a855f7] animate-spin" />}
                                        
                                        {pendingRoles[user.id] && pendingRoles[user.id] !== user.role && (
                                            <button 
                                                onClick={() => submitRoleUpdate(user.id)}
                                                className="bg-[#a855f7] text-white text-[10px] px-2 py-1 rounded shadow-[0_0_8px_rgba(168,85,247,0.4)] hover:bg-[#9333ea] hover:shadow-[0_0_12px_rgba(147,51,234,0.6)] font-bold transition-all disabled:opacity-50"
                                                disabled={isUpdating === user.id}
                                            >
                                                Apply
                                            </button>
                                        )}

                                        <select
                                            disabled={isUpdating === user.id}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className={`bg-[#141417] text-xs font-bold px-2 py-1.5 rounded border outline-none cursor-pointer transition-all ${
                                                (pendingRoles[user.id] || user.role) === 'OWNER' ? 'text-[#a855f7] border-[#a855f7]/30' :
                                                (pendingRoles[user.id] || user.role) === 'MANAGER' ? 'text-blue-500 border-blue-500/30' :
                                                (pendingRoles[user.id] || user.role) === 'SELLER' ? 'text-green-500 border-green-500/30' :
                                                (pendingRoles[user.id] || user.role) === 'SUPPORT' ? 'text-yellow-500 border-yellow-500/30' :
                                                'text-gray-400 border-gray-600'
                                            } disabled:opacity-50`}
                                            value={pendingRoles[user.id] || user.role}
                                        >
                                            <option value="USER">USER</option>
                                            <option value="SUPPORT">SUPPORT</option>
                                            <option value="SELLER">SELLER</option>
                                            <option value="MANAGER">MANAGER</option>
                                            {canAssignOwner && <option value="OWNER">OWNER</option>}
                                        </select>

                                        {user.id !== currentUser.id && (
                                            <>
                                                <button
                                                    disabled={isBlocking === user.id || isDeleting === user.id}
                                                    onClick={() => handleBlockToggle(user.id, !!user.isBlocked)}
                                                    title={user.isBlocked ? "Unblock User" : "Block User"}
                                                    className={`p-1.5 rounded transition-all ${user.isBlocked
                                                        ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                                        : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                        } disabled:opacity-50`}
                                                >
                                                    {isBlocking === user.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : user.isBlocked ? (
                                                        <UserCheck className="h-4 w-4" />
                                                    ) : (
                                                        <Ban className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <button
                                                    disabled={isBlocking === user.id || isDeleting === user.id}
                                                    onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                                                    title="Delete User"
                                                    className="p-1.5 rounded transition-all bg-red-900/40 text-red-500 hover:bg-red-900/60 disabled:opacity-50"
                                                >
                                                    {isDeleting === user.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
