import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const Refund = () => (
  <div className="min-h-screen" style={{ background: "#080808", color: "#e8e8e8" }}>
    <Navbar />
    <section className="pt-32 pb-20 max-w-3xl mx-auto px-6">
      <h1 className="text-3xl font-extrabold mb-8">Refund Policy</h1>
      <div className="space-y-6 text-sm leading-relaxed" style={{ color: "#aaa" }}>
        <p><strong className="text-white">Last updated:</strong> February 26, 2026</p>

        <h2 className="text-lg font-bold text-white pt-2">7-Day Money Back Guarantee</h2>
        <p>We offer a full refund within <strong className="text-white">7 days</strong> of your initial subscription purchase. If you're not satisfied with TikProfitPro for any reason, contact us within 7 days and we'll process a complete refund — no questions asked.</p>

        <h2 className="text-lg font-bold text-white pt-2">How to Request a Refund</h2>
        <p>Email <span style={{ color: "#00ff85" }}>support@tikprofitpro.io</span> with your account email and the reason for your refund request. Refunds are typically processed within 3–5 business days.</p>

        <h2 className="text-lg font-bold text-white pt-2">After 7 Days</h2>
        <p>After the 7-day window, refunds are not available. However, you can <strong className="text-white">cancel your subscription at any time</strong> and retain access to paid features until the end of your current billing period. No further charges will occur after cancellation.</p>

        <h2 className="text-lg font-bold text-white pt-2">Exceptions</h2>
        <p>If you experience a technical issue that prevents you from using the Service, we may offer a prorated refund or credit at our discretion, regardless of the 7-day window.</p>

        <p className="pt-4">Questions? Reach out at <span style={{ color: "#00ff85" }}>support@tikprofitpro.io</span>.</p>
      </div>
    </section>
    <Footer />
  </div>
);

export default Refund;
