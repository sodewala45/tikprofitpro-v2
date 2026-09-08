import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE = "https://tikprofitpro.shop";

type Meta = { title: string; description: string };

const routeMeta: Record<string, Meta> = {
  "/": {
    title: "TikProfitPro — Find Winning TikTok Shop Products Fast",
    description:
      "Discover trending TikTok Shop products before they go viral. Track virality scores, GMV and supplier prices in one dashboard built for TikTok sellers.",
  },
  "/calculator": {
    title: "Free TikTok Shop Profit Calculator — Fees Included",
    description:
      "Calculate true TikTok Shop profit per unit after product cost, shipping and the TikTok referral fee. Enter your numbers and see net profit and margin instantly.",
  },
  "/suppliers": {
    title: "Verified TikTok Shop Supplier Directory for Sellers",
    description:
      "Browse a curated directory of verified suppliers for TikTok Shop sellers, with categories, shipping times and minimum orders so you can source with confidence.",
  },
  "/demo": {
    title: "TikProfitPro Product Demo — See the Tool in Action",
    description:
      "Watch a full walkthrough of TikProfitPro in action. See product research, virality scores, supplier matching and the profit calculator demonstrated step by step.",
  },
  "/tutorials": {
    title: "TikProfitPro Tutorials — Video Guides for Sellers",
    description:
      "Watch step-by-step TikProfitPro video tutorials covering product research, virality scores, supplier matching and listing products on TikTok Shop in minutes.",
  },
  "/pricing": {
    title: "TikProfitPro Pricing — Free, Pro and Ultimate Plans",
    description:
      "Compare TikProfitPro plans side by side, from the free tier with 5 credits to Pro and Ultimate access for product data and supplier tools. Cancel anytime you like.",
  },
  "/signup": {
    title: "Create Your Free TikProfitPro Account — 5 Credits",
    description:
      "Sign up for a free TikProfitPro account and get 5 credits to research trending TikTok Shop products, check supplier prices and calculate real profit margins.",
  },
  "/login": {
    title: "Log In to TikProfitPro — TikTok Shop Research Tools",
    description:
      "Log in to TikProfitPro to access your dashboard with trending TikTok Shop products, virality scores, verified suppliers and your saved profit calculations.",
  },
  "/terms": {
    title: "TikProfitPro Terms of Service — Accounts and Billing",
    description:
      "Read the TikProfitPro Terms of Service covering account rules, subscriptions and billing, cancellation, intellectual property, liability limits and governing law.",
  },
  "/refund": {
    title: "TikProfitPro Refund Policy — 7-Day Money-Back Deal",
    description:
      "TikProfitPro offers a 7-day money-back guarantee on new subscriptions. Learn how to request a refund, typical processing times and how cancellation works later.",
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
