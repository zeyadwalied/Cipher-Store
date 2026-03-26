import { Search, Package, MapPin, Clock, CheckCircle } from "lucide-react"

export default function TrackingPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12 border-b border-[#27272a] pb-8">
        <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Track Your Order</h1>
        <p className="text-gray-400">Enter your order ID below to see the current status of your purchase.</p>
      </div>

      <div className="bg-[#141417] border border-[#27272a] rounded-xl p-8 mb-12 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#a855f7]/5 rounded-full blur-[80px]" />
        
        <form className="relative flex flex-col sm:flex-row items-center gap-4 z-10 max-w-2xl mx-auto">
          <div className="relative w-full">
            <Package className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="e.g. ORD-123456789"
              className="w-full bg-[#09090b] border border-[#27272a] rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] transition-all"
            />
          </div>
          <button 
            type="button" 
            className="w-full sm:w-auto bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center justify-center gap-2"
          >
            <Search className="h-5 w-5" />
            Track
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#141417] border border-[#27272a] rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6 border-b border-[#27272a] pb-4">How it works</h3>
          <ul className="space-y-6">
            <li className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-[#27272a] border border-gray-600 flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
              <div>
                <h4 className="text-white font-medium">Place Order</h4>
                <p className="text-sm text-gray-400">Complete checkout with your preferred payment.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-[#27272a] border border-gray-600 flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
              <div>
                <h4 className="text-white font-medium">Processing</h4>
                <p className="text-sm text-gray-400">Our system verifies the payment securely.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-[#a855f7] border border-[#9333ea] flex items-center justify-center text-white font-bold flex-shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.4)]">3</div>
              <div>
                <h4 className="text-white font-medium text-[#a855f7]">Delivery</h4>
                <p className="text-sm text-gray-400">Code/account delivered to email & dashboard.</p>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="bg-gradient-to-br from-[#141417] to-[#1a1225] border border-[#a855f7]/30 rounded-xl p-6 flex flex-col justify-center text-center items-center">
          <CheckCircle className="h-16 w-16 text-[#0ea5e9] mb-4 drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
          <h3 className="text-xl font-bold text-white mb-2">99% Instant Delivery</h3>
          <p className="text-gray-400 text-sm max-w-xs">Most of our digital products are delivered instantly via email immediately after successful payment verification.</p>
        </div>
      </div>
    </div>
  )
}
