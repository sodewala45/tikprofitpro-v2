import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const DEMO_VIDEO_ID = "lWwx4ZflJyU";

export default function Demo() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4 md:px-6">
        <div className="max-w-[800px] mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              See TikProfitPro in Action
            </h1>
            <p className="text-muted-foreground">
              A short product walkthrough: how to spot winning TikTok Shop products,
              check virality scores, match suppliers and work out real profit.
            </p>
          </div>

          <div
            className="rounded-2xl overflow-hidden border border-border"
            style={{ boxShadow: "0 0 40px rgba(0,255,136,0.12)" }}
          >
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
              <iframe
                src={`https://www.youtube.com/embed/${DEMO_VIDEO_ID}?rel=0&modestbranding=1`}
                title="TikProfitPro product demo"
                className="absolute inset-0 w-full h-full"
                frameBorder={0}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold min-h-[44px]"
              style={{ background: "linear-gradient(135deg, #00ff85, #00cc6a)", color: "#080808" }}
            >
              Start for Free
            </Link>
            <Link
              to="/tutorials"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-medium border border-border text-foreground min-h-[44px] hover:bg-muted/30 transition-colors"
            >
              Browse Tutorials
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
