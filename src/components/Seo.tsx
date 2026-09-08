import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE = "https://tikprofitpro.shop";

type Meta = { title: string; description: string };

const routeMeta: Record<string, Meta> = {
  "/": {
    title: "TikProfitPro — Find Winning TikTok Shop Products Fast",
    description:
      "Track TikTok Shop virality scores, GMV and supplier prices in one dashboard. Spot winning products early and calculate real profit after every TikTok fee.",
  },
  "/calculator": {
    title: "TikTok Shop Profit Calculator — Margins After Fees",
    description:
      "Free TikTok Shop profit calculator. Enter product cost, shipping, referral fee and selling price to see net profit per unit and margin percentage instantly.",
  },
  "/suppliers": {
    title: "TikTok Shop Supplier Directory — Verified Sources",
    description:
      "Browse a verified supplier directory for TikTok Shop sellers, with categories, shipping times and minimum order details so you can source products with confidence.",
  },
  "/pricing": {
    title: "TikProfitPro Pricing — Free Plan and Pro Options",
    description:
      "Compare TikProfitPro plans, from the free tier with 5 credits to Pro and Ultimate access for trending product data, supplier matching and profit tools. Cancel anytime.",
  },
  "/tutorials": {
    title: "TikProfitPro Tutorials — Video Guides for Sellers",
    description:
      "Watch step-by-step TikProfitPro video tutorials covering product research, virality scores, supplier matching and listing products on TikTok Shop in minutes.",
  },
  "/signup": {
    title: "Create Your Free TikProfitPro Account Today",
    description:
      "Sign up free for TikProfitPro and start researching trending TikTok Shop products, checking supplier prices and calculating profit margins with 5 free credits.",
  },
  "/login": {
    title: "Log In to TikProfitPro — TikTok Shop Research",
    description:
      "Log in to your TikProfitPro account to access trending TikTok Shop products, virality scores, verified suppliers, saved listings and your profit calculator tools.",
  },
  "/terms": {
    title: "Terms of Service — TikProfitPro Seller Platform",
    description:
      "Read the TikProfitPro Terms of Service covering accounts, subscriptions and billing, cancellation, intellectual property, liability limits and governing law.",
  },
  "/refund": {
    title: "Refund Policy — 7-Day Money Back Guarantee",
    description:
      "TikProfitPro offers a 7-day money back guarantee on new subscriptions. Learn how to request a refund, processing times, and how cancellation works after 7 days.",
  },
};

export default function Seo() {
  const { pathname } = useLocation();
  const key = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const meta = routeMeta[key];
  if (!meta) return null;
  const url = `${SITE}${key === "/" ? "/" : key}`;

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
    </Helmet>
  );
}
