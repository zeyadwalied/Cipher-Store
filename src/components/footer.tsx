import Link from "next/link"
import { Gamepad2 } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-[#27272a] bg-[#09090b] pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-0 text-xl font-bold tracking-tighter text-white">
              <img
                src="/favicon.ico.png"
                alt="Logo"
                className="w-8 h-8 object-contain drop-shadow-[0_0_6px_rgba(0,245,255,0.7)] shrink-0"
              />
              <span className="bg-gradient-to-r from-[#00f5ff] to-[#a855f7] bg-clip-text text-transparent">
                ipher Store
              </span>
            </Link>
            <p className="text-sm text-gray-400 max-w-xs">
              Your premium destination for gaming digital goods, top-ups, steam accounts, and boosting services.
            </p>
          </div>

          {/* Links 1 */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-semibold mb-2">Store</h3>
            <Link href="/category/topup" className="text-sm text-gray-400 hover:text-[#a855f7] transition-colors">Game Top-Up</Link>
            <Link href="/category/giftcards" className="text-sm text-gray-400 hover:text-[#a855f7] transition-colors">Gift Cards</Link>
            <Link href="/category/steam" className="text-sm text-gray-400 hover:text-[#a855f7] transition-colors">Steam Accounts</Link>
            <Link href="/category/services" className="text-sm text-gray-400 hover:text-[#a855f7] transition-colors">Services</Link>
          </div>

          {/* Links 2 */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white font-semibold mb-2">Support</h3>
            <Link href="/support" className="text-sm text-gray-400 hover:text-[#a855f7] transition-colors">Help Center</Link>
            <Link href="/faq" className="text-sm text-gray-400 hover:text-[#a855f7] transition-colors">FAQ</Link>
            <Link href="/tracking" className="text-sm text-gray-400 hover:text-[#a855f7] transition-colors">Order Tracking</Link>
            <Link href="/contact" className="text-sm text-gray-400 hover:text-[#a855f7] transition-colors">Contact Us</Link>
          </div>

          {/* Socials */}
          <div className="flex flex-col gap-4">
            <h3 className="text-white font-semibold">Join the Community</h3>
            <p className="text-sm text-gray-400">Join our Discord server for 24/7 support and exclusive giveaways.</p>
            <a
              href="https://discord.gg/cipherstore"
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#4752C4]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.01.02.05.03.08.02c1.71-.53 3.44-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z" />
              </svg>
              Join Discord Server
            </a>
          </div>
        </div>

        <div className="mt-16 flex flex-col sm:flex-row items-center justify-between border-t border-[#27272a] pt-8">
          <p className="text-sm text-gray-500" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} Cipher Store. All rights reserved.
          </p>
          <div className="mt-4 sm:mt-0 flex items-center gap-4">
            <span className="text-xs text-gray-500">Prices include VAT where applicable.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
