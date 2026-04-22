import Link from "next/link"
import Image from "next/image"
import { Gamepad2 } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-[#27272a] bg-[#09090b] pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-0 text-xl font-bold tracking-tighter text-white">
              <Image
                src="/favicon.ico.png"
                alt="Cipher Store logo"
                width={32}
                height={32}
                sizes="32px"
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
            <h3 className="text-white font-semibold">Our Values</h3>
            <p className="text-sm text-gray-400">Quality, Security, and Speed in every digital transaction.</p>
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
