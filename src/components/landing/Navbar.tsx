import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Tutorials", href: "/tutorials" },
  { label: "Blog", href: "https://blog.tikprofitpro.shop", external: true },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAnchorClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const id = href.replace("/#", "");
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#080808]/90 backdrop-blur-xl border-b border-white/5 py-3"
          : "py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link to={session ? "/dashboard" : "/"}>
          <img src="/tikprofitpro_logo.svg" alt="TikProfitPro" height="32" style={{ height: 32 }} className="md:h-10 cursor-pointer hover:opacity-80 transition-opacity" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
            link.href.startsWith("/#") ? (
              <a key={link.label} href={link.href} onClick={(e) => handleAnchorClick(e, link.href)}
                className="text-sm text-[#888] hover:text-white transition-colors cursor-pointer">
                {link.label}
              </a>
            ) : (link as any).external ? (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                className="text-sm text-[#888] hover:text-white transition-colors">
                {link.label}
              </a>
            ) : (
              <Link key={link.label} to={link.href} className="text-sm text-[#888] hover:text-white transition-colors">
                {link.label}
              </Link>
            )
          )}
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <Link to="/dashboard"
              className="hidden md:inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #00ff85, #00cc6a)", color: "#080808" }}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login"
                className="hidden md:inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors">
                Log In
              </Link>
              <Link to="/pricing#free"
                className="hidden md:inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-[#00ff85]/10"
                style={{ borderColor: "#00ff85", color: "#00ff85" }}>
                Start for Free
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-white/70 hover:text-white"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-[#080808]/95 backdrop-blur-xl border-b border-white/5"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) =>
                link.href.startsWith("/#") ? (
                  <a key={link.label} href={link.href} onClick={(e) => handleAnchorClick(e, link.href)}
                    className="block py-3 text-base text-[#888] hover:text-white transition-colors min-h-[44px]">
                    {link.label}
                  </a>
                ) : (link as any).external ? (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}
                    className="block py-3 text-base text-[#888] hover:text-white transition-colors min-h-[44px]">
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.label} to={link.href} onClick={() => setMobileOpen(false)}
                    className="block py-3 text-base text-[#888] hover:text-white transition-colors min-h-[44px]">
                    {link.label}
                  </Link>
                )
              )}
              <div className="pt-3 border-t border-white/5">
                {session ? (
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                    className="block w-full text-center py-3 rounded-xl text-sm font-semibold min-h-[44px]"
                    style={{ background: "linear-gradient(135deg, #00ff85, #00cc6a)", color: "#080808" }}>
                    Dashboard
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link to="/login" onClick={() => setMobileOpen(false)}
                      className="block w-full text-center py-3 rounded-xl text-sm font-medium text-white/80 hover:text-white min-h-[44px]">
                      Log In
                    </Link>
                    <Link to="/pricing#free" onClick={() => setMobileOpen(false)}
                      className="block w-full text-center py-3 rounded-xl text-sm font-semibold border min-h-[44px]"
                      style={{ borderColor: "#00ff85", color: "#00ff85" }}>
                      Start for Free
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
