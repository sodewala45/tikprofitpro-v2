import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Pricing = () => {
  const { session } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (location.hash === "#free") {
      const el = document.getElementById("free");
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  const handleCheckout = async (plan: string) => {
    setLoadingPlan(plan);
    try {
      await api.createCheckout(plan);
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err?.message || "Please try again later.", variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  };

  const freeCta = session ? "/dashboard" : "/signup";

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: "#080808", color: "#e8e8e8" }}>
      <Navbar />

      <section className="pt-28 md:pt-36 pb-16 md:pb-24 max-w-5xl mx-auto px-4 md:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 md:mb-14">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Simple, Transparent Pricing</h1>
          <p className="text-sm md:text-base" style={{ color: "#888" }}>One product win pays for months of ProfitScout</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {/* Free */}
          <motion.div id="free" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="p-6 md:p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
            <p className="text-sm" style={{ color: "#888" }}>Free</p>
            <p className="text-4xl md:text-5xl font-extrabold mt-1">$0</p>
            <p className="text-xs mt-1 mb-5 md:mb-6" style={{ color: "#666" }}>Forever free</p>
            {["10 trending products", "Basic virality scores", "Dashboard overview"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm mb-2.5"><span style={{ color: "#00ff85" }}>✓</span> {f}</div>
            ))}
            {["Full 100 products", "Sourcing credits", "Profit calculator", "Supplier matching"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm mb-2.5" style={{ color: "#555" }}><span>✕</span> {f}</div>
            ))}
            <Link to={freeCta}
              className="mt-5 md:mt-6 w-full inline-flex justify-center py-3.5 rounded-xl border border-white/15 text-sm font-medium hover:bg-white/5 transition-all min-h-[44px] items-center">
              Start for Free
            </Link>
          </motion.div>

          {/* Pro */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-6 md:p-8 rounded-2xl border relative overflow-hidden"
            style={{ borderColor: "rgba(0,255,133,0.25)", background: "linear-gradient(135deg, rgba(0,255,133,0.06), rgba(0,204,106,0.02))", boxShadow: "0 0 60px rgba(0,255,133,0.06)" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, transparent, #00ff85, transparent)" }} />
            <div className="flex justify-between items-center">
              <p className="text-sm" style={{ color: "#00ff85" }}>Pro</p>
              <span className="text-xs px-3 py-1 rounded-full border" style={{ background: "rgba(0,255,133,0.1)", borderColor: "rgba(0,255,133,0.25)", color: "#00ff85" }}>Most Popular</span>
            </div>
            <p className="text-4xl md:text-5xl font-extrabold mt-1">$39</p>
            <p className="text-xs mt-1 mb-5 md:mb-6" style={{ color: "#666" }}>per month</p>
            {["All 100 trending products", "50 sourcing credits/month", "Alibaba + AliExpress + Amazon", "Profit calculator", "Advanced virality scores", "Weekly updated rankings"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm mb-2.5"><span style={{ color: "#00ff85" }}>✓</span> {f}</div>
            ))}
            <button onClick={() => handleCheckout("pro")} disabled={loadingPlan === "pro"}
              className="mt-5 md:mt-6 w-full inline-flex justify-center py-3.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50 min-h-[44px] items-center"
              style={{ background: "linear-gradient(135deg, #00ff85, #00cc6a)", color: "#080808", boxShadow: "0 0 30px rgba(0,255,133,0.3)" }}>
              {loadingPlan === "pro" ? "Loading..." : "Start for $39/mo →"}
            </button>
          </motion.div>

          {/* Ultimate */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="p-6 md:p-8 rounded-2xl border border-white/5 bg-white/[0.02]">
            <p className="text-sm" style={{ color: "#c0a0ff" }}>Ultimate</p>
            <p className="text-4xl md:text-5xl font-extrabold mt-1">$99</p>
            <p className="text-xs mt-1 mb-5 md:mb-6" style={{ color: "#666" }}>per month</p>
            {["All 100 trending products", "120 sourcing credits/month", "All Pro features included", "Priority support", "Early access to new features", "Dedicated account manager"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm mb-2.5"><span style={{ color: "#c0a0ff" }}>✓</span> {f}</div>
            ))}
            <button onClick={() => handleCheckout("ultimate")} disabled={loadingPlan === "ultimate"}
              className="mt-5 md:mt-6 w-full inline-flex justify-center py-3.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50 border min-h-[44px] items-center"
              style={{ borderColor: "rgba(192,160,255,0.4)", color: "#c0a0ff", background: "rgba(192,160,255,0.08)" }}>
              {loadingPlan === "ultimate" ? "Loading..." : "Start for $99/mo →"}
            </button>
          </motion.div>
        </div>

        <p className="text-center text-xs mt-8" style={{ color: "#555" }}>No contracts · Cancel anytime · 7-day money back guarantee</p>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
