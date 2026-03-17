import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const demoProducts = [
  { name: "Gua Sha Facial Tool", category: "Beauty", virality: 94, gmv: "$82K", supplier: "$3.20", margin: "68%" },
  { name: "LED Desk Lamp Foldable", category: "Electronics", virality: 88, gmv: "$61K", supplier: "$7.50", margin: "54%" },
  { name: "Posture Corrector Belt", category: "Health", virality: 85, gmv: "$55K", supplier: "$4.10", margin: "71%" },
  { name: "Magnetic Phone Mount", category: "Auto", virality: 81, gmv: "$48K", supplier: "$2.80", margin: "63%" },
  { name: "Portable Blender Cup", category: "Kitchen", virality: 76, gmv: "$39K", supplier: "$6.00", margin: "57%" },
  { name: "Wireless Earbuds Case", category: "Tech", virality: 72, gmv: "$34K", supplier: "$4.50", margin: "52%" },
  { name: "Silk Pillowcase Set", category: "Home", virality: 69, gmv: "$29K", supplier: "$5.20", margin: "60%" },
  { name: "Retinol Face Serum", category: "Beauty", virality: 65, gmv: "$25K", supplier: "$3.80", margin: "66%" },
  { name: "Mini Projector", category: "Electronics", virality: 61, gmv: "$21K", supplier: "$18.00", margin: "45%" },
  { name: "Resistance Bands Set", category: "Fitness", virality: 58, gmv: "$18K", supplier: "$2.50", margin: "72%" },
];

const viralityColor = (v: number) => (v >= 70 ? "#00ff85" : v >= 40 ? "#ffcc00" : "#ff4444");

const Demo = () => (
  <div className="min-h-screen pb-20 md:pb-0" style={{ background: "#080808", color: "#e8e8e8" }}>
    <Navbar />

    <section className="pt-28 md:pt-32 pb-16 md:pb-24 max-w-6xl mx-auto px-4 md:px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 md:mb-10">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2">Demo Dashboard</h1>
        <p className="text-sm md:text-base" style={{ color: "#888" }}>This is what Pro users see — real-time trending product data</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10">
        {[
          { label: "Total Products Tracked", value: "100" },
          { label: "Avg Virality Score", value: "74/100" },
          { label: "Top Category", value: "Beauty & Skincare" },
          { label: "GMV Tracked Today", value: "$2.3M" },
        ].map((s) => (
          <div key={s.label} className="p-4 md:p-5 rounded-2xl border border-white/5 bg-[#111]">
            <p className="text-xl md:text-2xl font-extrabold" style={{ color: "#00ff85" }}>{s.value}</p>
            <p className="text-[10px] md:text-xs mt-1" style={{ color: "#888" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl border border-white/5 bg-[#111] overflow-hidden">
        <div className="grid grid-cols-6 gap-4 px-6 py-3 text-xs font-medium uppercase tracking-wider border-b border-white/5" style={{ color: "#555" }}>
          <span className="col-span-2">Product</span>
          <span>Virality</span>
          <span>GMV Est.</span>
          <span>Supplier</span>
          <span>Margin</span>
        </div>

        {demoProducts.map((p, i) => (
          <div key={i} className={`grid grid-cols-6 gap-4 px-6 py-4 border-b border-white/[0.03] items-center ${i >= 5 ? "relative" : ""}`}
            style={i >= 5 ? { filter: "blur(5px)", userSelect: "none" } : {}}>
            <div className="col-span-2">
              <span className="text-sm font-medium">{p.name}</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "#888" }}>{p.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${p.virality}%`, background: viralityColor(p.virality) }} />
              </div>
              <span className="text-xs font-bold" style={{ color: viralityColor(p.virality) }}>{p.virality}</span>
            </div>
            <span className="text-sm">{p.gmv}</span>
            <span className="text-sm" style={{ color: "#888" }}>{p.supplier}</span>
            <span className="text-sm font-semibold" style={{ color: "#00ff85" }}>{p.margin}</span>
          </div>
        ))}

        <div className="relative -mt-[200px] h-[200px] flex items-center justify-center z-10"
          style={{ background: "linear-gradient(transparent, #111 60%)" }}>
          <Link to="/pricing"
            className="px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 min-h-[44px] inline-flex items-center"
            style={{ background: "linear-gradient(135deg, #00ff85, #00cc6a)", color: "#080808", boxShadow: "0 0 30px rgba(0,255,133,0.3)" }}>
            🔒 Upgrade to Pro to unlock all 100 products
          </Link>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {demoProducts.slice(0, 5).map((p, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-[#111] p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: "rgba(255,255,255,0.05)", color: "#888" }}>{p.category}</span>
              </div>
              <span className="text-sm font-semibold shrink-0" style={{ color: "#00ff85" }}>{p.margin}</span>
            </div>
            <div className="flex items-center justify-between text-xs" style={{ color: "#888" }}>
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p.virality}%`, background: viralityColor(p.virality) }} />
                </div>
                <span className="font-bold" style={{ color: viralityColor(p.virality) }}>{p.virality}</span>
              </div>
              <span>GMV: {p.gmv}</span>
            </div>
          </div>
        ))}
        {/* Blurred cards */}
        <div className="relative">
          {demoProducts.slice(5, 7).map((p, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-[#111] p-4 mb-3" style={{ filter: "blur(5px)", userSelect: "none" }}>
              <p className="text-sm font-medium">{p.name}</p>
            </div>
          ))}
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(transparent, rgba(17,17,17,0.9) 60%)" }}>
            <Link to="/pricing"
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px] inline-flex items-center"
              style={{ background: "linear-gradient(135deg, #00ff85, #00cc6a)", color: "#080808", boxShadow: "0 0 30px rgba(0,255,133,0.3)" }}>
              🔒 Upgrade to Pro
            </Link>
          </div>
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default Demo;
