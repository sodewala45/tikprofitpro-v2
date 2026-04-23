import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import SectionWrapper from "@/components/landing/SectionWrapper";
import ProfitCalcEmbed from "@/components/landing/ProfitCalcEmbed";
import FAQSection from "@/components/landing/FAQSection";
import { useCheckout } from "@/hooks/useCheckout";

const fadeChild = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const Landing = () => {
  const { checkout, loading: checkoutLoading } = useCheckout();

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: "#080808", color: "#e8e8e8" }}>
      {/* Grid BG */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ backgroundImage: "linear-gradient(rgba(0,255,133,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,133,0.025) 1px, transparent 1px)", backgroundSize: "70px 70px" }} />

      <Navbar />

      {/* ───── HERO ───── */}
      <section className="relative pt-28 md:pt-36 pb-16 md:pb-24 text-center max-w-4xl mx-auto px-4 md:px-6">
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[400px] md:w-[700px] h-[400px] md:h-[700px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,255,133,0.10) 0%, transparent 70%)" }} />

        <motion.div variants={stagger} initial="hidden" animate="show" className="relative z-10 space-y-5 md:space-y-7">
          <motion.div variants={fadeChild}>
            <span className="inline-block px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-medium border"
              style={{ background: "rgba(0,255,133,0.08)", borderColor: "rgba(0,255,133,0.25)", color: "#00ff85" }}>
              🔥 100 Trending Products Updated Weekly
            </span>
          </motion.div>

          <motion.h1 variants={fadeChild} className="text-3xl sm:text-4xl md:text-7xl font-extrabold leading-[1.1] md:leading-[1.05] tracking-tight">
            Find TikTok Shop<br />
            <span className="bg-gradient-to-r from-white to-[#00ff85] bg-clip-text text-transparent">Winners Before</span>
            <br />They Go Viral
          </motion.h1>

          <motion.p variants={fadeChild} className="text-base md:text-xl max-w-xl mx-auto leading-relaxed px-2" style={{ color: "#888" }}>
            Track virality scores, GMV data, and supplier prices — source profitable products before your competition.
          </motion.p>

          <motion.div variants={fadeChild} className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center px-4 sm:px-0">
            <Link to="/pricing"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 min-h-[48px]"
              style={{ background: "linear-gradient(135deg, #00ff85, #00cc6a)", color: "#080808", boxShadow: "0 0 35px rgba(0,255,133,0.35)" }}>
              Start for $39/mo →
            </Link>
            <Link to="/tutorials"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-medium border border-white/15 text-white/80 hover:border-white/30 hover:bg-white/5 transition-all inline-flex items-center justify-center min-h-[48px]">
              Watch Tutorials
            </Link>
          </motion.div>

          <motion.div variants={fadeChild}>
            <Link to="/pricing#free"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 border min-h-[48px]"
              style={{ borderColor: "#00ff85", color: "#00ff85", background: "rgba(0,255,133,0.08)" }}>
              Start for Free →
            </Link>
          </motion.div>

          <motion.div variants={fadeChild} className="flex items-center justify-center gap-3 pt-4">
            <div className="flex -space-x-2">
              {["A", "S", "M", "J"].map((l, i) => (
                <div key={i} className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
                  style={{ background: `hsl(${150 + i * 30}, 50%, ${25 + i * 5}%)`, borderColor: "#080808", color: "#fff" }}>
                  {l}
                </div>
              ))}
            </div>
            <span className="text-xs md:text-sm" style={{ color: "#666" }}>Joined by 2,400+ TikTok sellers</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ───── STATS ───── */}
      <SectionWrapper className="pb-16 md:pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { value: "100+", label: "Trending Products Weekly" },
            { value: "$2.3M+", label: "GMV Tracked Daily" },
            { value: "8,000+", label: "Sellers Trust TikProfitPro" },
            { value: "94%", label: "Find a Winner in Week 1" },
          ].map((s) => (
            <div key={s.label} className="p-4 md:p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-[#00ff85]/20 hover:bg-[#00ff85]/[0.03] transition-all group">
              <div className="text-2xl md:text-4xl font-extrabold" style={{ color: "#00ff85" }}>{s.value}</div>
              <div className="text-[10px] md:text-xs mt-1 md:mt-2" style={{ color: "#888" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* ───── HOW IT WORKS ───── */}
      <SectionWrapper id="how-it-works" className="pb-16 md:pb-24">
        <h2 className="text-2xl md:text-4xl font-extrabold text-center tracking-tight mb-4">How It Works</h2>
        <p className="text-center mb-8 md:mb-12 text-sm md:text-base" style={{ color: "#888" }}>Three steps to finding your next winning product</p>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {[
            { num: "1", icon: "📊", title: "We Track 1,000+ Products", desc: "We track 1,000+ TikTok Shop products weekly so you don't have to." },
            { num: "2", icon: "🧠", title: "Algorithm Scores Virality", desc: "Our algorithm scores virality before products peak — giving you the edge." },
            { num: "3", icon: "🚀", title: "You Source & List First", desc: "You find the supplier, calculate profit, and list it first — before the competition." },
          ].map((step) => (
            <div key={step.num} className="text-center relative">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-lg md:text-xl font-bold mx-auto mb-3 md:mb-4 border"
                style={{ borderColor: "#00ff85", color: "#00ff85", background: "rgba(0,255,133,0.08)" }}>
                {step.num}
              </div>
              <div className="text-2xl md:text-3xl mb-2 md:mb-3">{step.icon}</div>
              <h3 className="text-base md:text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#888" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* ───── FEATURES ───── */}
      <SectionWrapper id="features" className="pb-16 md:pb-24">
        <h2 className="text-2xl md:text-4xl font-extrabold text-center tracking-tight mb-4">Everything You Need to Win on TikTok Shop</h2>
        <p className="text-center mb-8 md:mb-12 text-sm md:text-base" style={{ color: "#888" }}>Powerful tools to find, validate, and source winning products</p>
        <div className="grid md:grid-cols-3 gap-4 md:gap-5">
          {[
            { icon: "🔥", title: "Virality Score Tracking", desc: "Know which products are about to explode before your competition does." },
            { icon: "💰", title: "Profit Calculator", desc: "Instantly calculate net profit after TikTok fees and ad spend." },
            { icon: "🏭", title: "Supplier Matching", desc: "Find verified suppliers with one click, compare prices and shipping times." },
          ].map((f) => (
            <div key={f.title} className="p-6 md:p-8 rounded-2xl border border-white/5 bg-[#111] hover:border-[#00ff85]/20 transition-all group">
              <div className="text-3xl md:text-4xl mb-3 md:mb-4">{f.icon}</div>
              <h3 className="text-base md:text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#888" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* ───── VIDEO TUTORIAL ───── */}
      <section className="pb-16 md:pb-24 px-4 md:px-6" style={{ background: "#080c14" }}>
        <div className="max-w-4xl mx-auto pt-16 md:pt-24">
          <h2 className="text-2xl md:text-4xl font-extrabold text-center tracking-tight mb-3" style={{ color: "#fff" }}>
            See TikProfitPro in Action
          </h2>
          <p className="text-center mb-8 md:mb-10 text-sm md:text-base" style={{ color: "#888" }}>
            Watch how to find winning products in under 2 minutes.
          </p>
          <div
            className="mx-auto relative w-full overflow-hidden rounded-2xl"
            style={{
              maxWidth: 800,
              paddingTop: "min(56.25%, 450px)",
              border: "1px solid rgba(0,255,136,0.3)",
              boxShadow: "0 0 60px rgba(0,255,136,0.2), 0 0 100px rgba(0,255,136,0.08)",
              background: "#000",
            }}
          >
            <iframe
              src="https://www.youtube.com/embed/lWwx4ZflJyU?rel=0&modestbranding=1"
              title="See TikProfitPro in Action"
              className="absolute inset-0 w-full h-full"
              frameBorder={0}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* ───── 3 STEPS ───── */}
      <SectionWrapper className="pb-16 md:pb-24">
        <h2 className="text-2xl md:text-4xl font-extrabold text-center tracking-tight mb-8 md:mb-12">Start Selling Winners in 3 Steps</h2>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {[
            { num: "1", icon: "🔍", title: "Browse Trending Products", desc: "Explore 100+ products ranked by virality score, updated weekly." },
            { num: "2", icon: "💰", title: "Calculate Profit Margins", desc: "Instantly see your net profit after all TikTok fees and ad costs." },
            { num: "3", icon: "🚀", title: "Source & Launch", desc: "Find verified suppliers, place orders, and start selling fast." },
          ].map((step) => (
            <div key={step.num} className="text-center relative">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-base md:text-lg font-bold mx-auto mb-3 md:mb-4 border"
                style={{ borderColor: "#00ff85", color: "#00ff85", background: "rgba(0,255,133,0.08)" }}>
                {step.num}
              </div>
              <div className="text-2xl md:text-3xl mb-2 md:mb-3">{step.icon}</div>
              <h3 className="text-base md:text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm" style={{ color: "#888" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* ───── CALCULATOR PREVIEW ───── */}
      <SectionWrapper className="pb-16 md:pb-24">
        <h2 className="text-2xl md:text-4xl font-extrabold text-center tracking-tight mb-3">Know Your Profit Before You Commit</h2>
        <p className="text-center mb-8 md:mb-10 text-sm md:text-base" style={{ color: "#888" }}>Try the live calculator — enter your numbers and see instant results</p>
        <div className="p-4 md:p-8 rounded-2xl border border-white/5 bg-[#111]">
          <ProfitCalcEmbed />
        </div>
      </SectionWrapper>

      {/* ───── PRICING PREVIEW ───── */}
      <SectionWrapper className="pb-16 md:pb-24">
        <h2 className="text-2xl md:text-4xl font-extrabold text-center tracking-tight mb-3">Simple Pricing</h2>
        <p className="text-center mb-8 md:mb-10 text-sm md:text-base" style={{ color: "#888" }}>One product win pays for months of TikProfitPro</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
          {/* Free */}
          <div className="p-6 md:p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
            <p className="text-sm" style={{ color: "#888" }}>Free</p>
            <p className="text-4xl md:text-5xl font-extrabold mt-1">$0</p>
            <p className="text-xs mt-1 mb-5 md:mb-6" style={{ color: "#666" }}>Forever free</p>
            {["Top 10 trending products", "Basic virality scores", "Dashboard overview"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm mb-2.5"><span style={{ color: "#00ff85" }}>✓</span> {f}</div>
            ))}
            {["Full 100 products", "Supplier matching", "Profit calculator", "Product detail stats"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm mb-2.5" style={{ color: "#555" }}><span>✕</span> {f}</div>
            ))}
            <Link to="/pricing#free" className="mt-5 md:mt-6 w-full inline-flex justify-center py-3 rounded-xl border border-white/15 text-sm font-medium hover:bg-white/5 transition-all min-h-[44px] items-center">
              Start Free
            </Link>
          </div>
          {/* Pro */}
          <div className="p-6 md:p-8 rounded-2xl border relative overflow-hidden"
            style={{ borderColor: "rgba(0,255,133,0.25)", background: "linear-gradient(135deg, rgba(0,255,133,0.06), rgba(0,204,106,0.02))", boxShadow: "0 0 60px rgba(0,255,133,0.06)" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #00ff85, transparent)" }} />
            <div className="flex justify-between items-center">
              <p className="text-sm" style={{ color: "#00ff85" }}>Pro</p>
              <span className="text-xs px-3 py-1 rounded-full border" style={{ background: "rgba(0,255,133,0.1)", borderColor: "rgba(0,255,133,0.25)", color: "#00ff85" }}>Most Popular</span>
            </div>
            <p className="text-4xl md:text-5xl font-extrabold mt-1">$39</p>
            <p className="text-xs mt-1 mb-5 md:mb-6" style={{ color: "#666" }}>per month</p>
            {["All 100 trending products", "Advanced virality scores", "Profit calculator", "Supplier matching (50 credits)", "Full product detail stats", "Weekly updated rankings"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm mb-2.5"><span style={{ color: "#00ff85" }}>✓</span> {f}</div>
            ))}
            <Link to="/pricing"
              className="mt-5 md:mt-6 w-full inline-flex justify-center py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 min-h-[44px] items-center"
              style={{ background: "linear-gradient(135deg, #00ff85, #00cc6a)", color: "#080808", boxShadow: "0 0 30px rgba(0,255,133,0.3)" }}>
              Start for $39/mo →
            </Link>
          </div>
          {/* Ultimate */}
          <div className="p-6 md:p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
            <p className="text-sm" style={{ color: "#00ff85" }}>Ultimate</p>
            <p className="text-4xl md:text-5xl font-extrabold mt-1">$99</p>
            <p className="text-xs mt-1 mb-5 md:mb-6" style={{ color: "#666" }}>per month</p>
            {["Everything in Pro", "120 credits/month", "Priority support", "Early access to new features", "Onboarding call"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm mb-2.5"><span style={{ color: "#00ff85" }}>✓</span> {f}</div>
            ))}
            <button onClick={() => checkout("ultimate")} disabled={checkoutLoading}
              className="mt-5 md:mt-6 w-full inline-flex justify-center py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 min-h-[44px] items-center"
              style={{ background: "linear-gradient(135deg, #00ff85, #00cc6a)", color: "#080808", boxShadow: "0 0 30px rgba(0,255,133,0.3)" }}>
              {checkoutLoading ? "Loading..." : "Start Ultimate →"}
            </button>
          </div>
        </div>
        <p className="text-center text-xs mt-6" style={{ color: "#555" }}>No contracts · Cancel anytime · 7-day money back guarantee</p>
      </SectionWrapper>

      {/* ───── TESTIMONIALS ───── */}
      <SectionWrapper className="pb-16 md:pb-24">
        <h2 className="text-2xl md:text-4xl font-extrabold text-center tracking-tight mb-8 md:mb-10">What Sellers Are Saying</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {[
            { name: "Alex R.", handle: "@dropking_jay", quote: "Found a $40K/mo product in my first week using TikProfitPro. Worth every penny.", initials: "AR" },
            { name: "Maria T.", handle: "@tikshop_maria", quote: "The profit calculator alone saves me hours every week. I never launch without checking it first.", initials: "MT" },
            { name: "James K.", handle: "@ecom_jamesk", quote: "Virality scores are incredibly accurate. Caught 3 winners before they blew up.", initials: "JK" },
          ].map((t) => (
            <div key={t.name} className="p-5 md:p-6 rounded-2xl border border-white/5 bg-[#111] hover:border-[#00ff85]/10 transition-all">
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "rgba(0,255,133,0.15)", color: "#00ff85" }}>
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs" style={{ color: "#666" }}>{t.handle}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-3">
                {Array(5).fill(0).map((_, i) => (<span key={i} style={{ color: "#00ff85" }}>★</span>))}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#aaa" }}>"{t.quote}"</p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* ───── FINAL CTA ───── */}
      <SectionWrapper className="pb-16 md:pb-24 text-center">
        <h2 className="text-2xl md:text-5xl font-extrabold tracking-tight mb-6">
          Ready to Find Your Next<br />
          <span style={{ color: "#00ff85" }}>Winning Product?</span>
        </h2>
        <div className="flex flex-col items-center gap-3 md:gap-4 px-4 sm:px-0">
          <Link to="/pricing"
            className="w-full sm:w-auto px-10 py-4 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5 min-h-[48px] inline-flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #00ff85, #00cc6a)", color: "#080808", boxShadow: "0 0 40px rgba(0,255,133,0.35)" }}>
            Start for $39/mo →
          </Link>
          <Link to="/pricing#free"
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 border min-h-[48px]"
            style={{ borderColor: "#00ff85", color: "#00ff85", background: "rgba(0,255,133,0.08)" }}>
            Start for Free →
          </Link>
        </div>
      </SectionWrapper>

      <FAQSection />
      <Footer />
    </div>
  );
};

export default Landing;
