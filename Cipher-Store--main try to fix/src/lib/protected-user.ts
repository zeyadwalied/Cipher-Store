/**
 * Shadow Owner Protection System
 * 
 * Hardcoded list of protected email addresses that can NEVER have their
 * role changed, be blocked, or be deleted — even by another OWNER.
 * 
 * Any attempt will silently succeed (fake response) but the DB stays untouched.
 * A Discord alert is sent to notify the protected owner of the attempt.
 */

const PROTECTED_EMAILS: string[] = [
  "magdyyuossef18@gmail.com",
  "zezo.magd30@gmail.com"
]

/**
 * Check if a given email is in the protected list.
 */
export function isProtectedUser(email: string | null | undefined): boolean {
  if (!email) return false
  return PROTECTED_EMAILS.includes(email.toLowerCase())
}

/**
 * Silently log a protection event to Discord.
 * This alerts the protected owner that someone tried to modify their account.
 */
export async function logProtectionEvent(
  action: "ROLE_CHANGE" | "BLOCK" | "UNBLOCK" | "DELETE",
  attackerEmail: string,
  targetEmail: string,
  details?: string
): Promise<void> {
  try {
    const { sendDiscordLog } = await import("@/lib/discord")

    const actionLabels: Record<string, string> = {
      ROLE_CHANGE: "🔄 محاولة تغيير رتبة",
      BLOCK: "🚫 محاولة حظر",
      UNBLOCK: "✅ محاولة إلغاء حظر",
      DELETE: "🗑️ محاولة حذف",
    }

    await sendDiscordLog("admin", {
      title: `🛡️ SHADOW PROTECTION TRIGGERED`,
      color: 0xff0055, // Red neon
      fields: [
        { name: "⚠️ Action Attempted", value: actionLabels[action] || action, inline: false },
        { name: "🎯 Protected Account", value: targetEmail, inline: true },
        { name: "👤 Attempted By", value: attackerEmail, inline: true },
        ...(details ? [{ name: "📝 Details", value: details, inline: false }] : []),
        { name: "📌 Status", value: "**BLOCKED** — No changes were made. Account is safe.", inline: false },
      ]
    })
  } catch (e) {
    // Silently fail — protection still works even if Discord is down
  }
}
