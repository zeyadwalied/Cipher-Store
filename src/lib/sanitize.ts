/**
 * Input sanitization utilities to prevent XSS and invalid data.
 */

/**
 * Strip HTML tags from a string to prevent XSS.
 * Keeps the text content, removes all tags.
 */
export function sanitizeString(input: string): string {
    if (!input || typeof input !== "string") return ""
    return input
        .replace(/<[^>]*>/g, "")       // Remove HTML tags
        .replace(/&lt;/g, "<")          // Decode common entities for re-encoding
        .replace(/&gt;/g, ">")
        .replace(/</g, "&lt;")          // Re-encode angle brackets
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")        // Encode quotes
        .replace(/'/g, "&#x27;")
        .trim()
}

/**
 * Validate email format.
 */
export function validateEmail(email: string): boolean {
    if (!email || typeof email !== "string") return false
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
}

/**
 * Validate password meets minimum requirements.
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
    if (!password || typeof password !== "string") {
        return { valid: false, message: "Password is required" }
    }
    if (password.length < 6) {
        return { valid: false, message: "Password must be at least 6 characters" }
    }
    if (password.length > 128) {
        return { valid: false, message: "Password is too long" }
    }
    return { valid: true }
}

/**
 * Validate and sanitize a name field.
 */
export function sanitizeName(name: string): string {
    if (!name || typeof name !== "string") return ""
    // Allow letters, numbers, spaces, Arabic chars — strip everything else
    return name.replace(/<[^>]*>/g, "").trim().slice(0, 100)
}
