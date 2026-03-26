import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface User {
    role: string
    isBlocked: boolean
    name?: string | null
    email?: string | null
    image?: string | null
  }
  interface Session {
    user: {
      id: string
      role: string
      isBlocked: boolean
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    role: string
    isBlocked: boolean
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Import headers dynamically to avoid Next.js build issues in Auth.js config
          const { headers } = await import("next/headers");
          const { rateLimit } = await import("@/lib/rate-limit");

          const reqHeaders = await headers();
          const ip = reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() ||
            reqHeaders.get("x-real-ip") ||
            "unknown";

          // 10 login attempts per 15 minutes per IP
          const { limited } = rateLimit(`login:${ip}`, { maxAttempts: 10, windowMs: 15 * 60 * 1000 });
          if (limited) {
            throw new Error("Too many login attempts. Please try again later.");
          }
        } catch (e: any) {
          if (e.message.includes("Too many login attempts")) throw e;
          // Ignore header errors during build/static generation
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.password) {
          return null
        }

        const dbUser = user as any;

        // 🛡️ Shadow Owner Protection — protected users bypass block & verification checks
        const { isProtectedUser } = await import("@/lib/protected-user")
        const isProtected = isProtectedUser(user.email)

        if (!isProtected && dbUser.isBlocked) {
          // In Auth.js v5, we should throw a specific error or handle it in the callback
          throw new Error("BLOCKED:تم حظر حسابك، يرجى التواصل مع المسؤول لمزيد من المعلومات")
        }

        // Maintain security: Require email verification for regular Users
        // Admins/Staff created manually are exempt to prevent blocking existing management
        if (!isProtected && !user.emailVerified && (user as any).role === "USER") {
          throw new Error("Your email is not verified. Please check your inbox.")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: (user as any).role,
          isBlocked: (user as any).isBlocked
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.id = user.id as string
        token.isBlocked = user.isBlocked
      }
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } }) as any
        if (dbUser) {
          token.role = dbUser.role
          token.isBlocked = dbUser.isBlocked
        }
      }

      // 🛡️ Shadow Owner Protection — always override to OWNER & unblocked for protected emails
      const { isProtectedUser } = await import("@/lib/protected-user")
      if (isProtectedUser(token.email)) {
        token.role = "OWNER"
        token.isBlocked = false
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
        session.user.isBlocked = token.isBlocked as boolean
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  events: {
    async signIn({ user }) {
      try {
        const { sendDiscordLog } = await import("@/lib/discord");
        await sendDiscordLog("users", {
          title: "🔑 User Logged In",
          color: 0x22c55e, // Green
          fields: [
            { name: "Email", value: user.email || "Unknown", inline: true },
            { name: "Name", value: user.name || "Unknown", inline: true },
            { name: "Role", value: user.role || "USER", inline: true }
          ]
        })
      } catch (e) { }
    }
  }
})
