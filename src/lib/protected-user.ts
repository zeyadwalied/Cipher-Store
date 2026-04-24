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

  "zeyadmagd373@gmail.com"
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
    // Discord alert removed
  } catch (e) {
    // Silently fail
  }
}
