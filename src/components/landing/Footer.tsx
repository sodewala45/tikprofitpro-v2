import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
        <div className="text-center md:text-left">
          <img src="/tikprofitpro_logo.svg" alt="TikProfitPro" style={{ height: 28 }} className="mx-auto md:mx-0" />
          <p className="text-[#666] text-xs md:text-sm mt-1">
            Find winning TikTok Shop products before they go viral.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs md:text-sm text-[#666]">
          <Link to="/pricing" className="hover:text-white transition-colors min-h-[44px] flex items-center">Pricing</Link>
          <Link to="/suppliers" className="hover:text-white transition-colors min-h-[44px] flex items-center">Suppliers</Link>
          <Link to="/tutorials" className="hover:text-white transition-colors min-h-[44px] flex items-center">Tutorials</Link>
          <Link to="/calculator" className="hover:text-white transition-colors min-h-[44px] flex items-center">Calculator</Link>
          <a href="https://blog.tikprofitpro.shop" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors min-h-[44px] flex items-center">Blog</a>
          <Link to="/terms" className="hover:text-white transition-colors min-h-[44px] flex items-center">Terms</Link>
          <Link to="/refund" className="hover:text-white transition-colors min-h-[44px] flex items-center">Refund Policy</Link>
        </div>
        <p className="text-[#444] text-xs">© 2026 TikProfitPro. All rights reserved.</p>
      </div>
    </footer>
  );
}
