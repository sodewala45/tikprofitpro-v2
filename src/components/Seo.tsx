import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE = "https://tikprofitpro.shop";
const OG_IMAGE = "https://tikprofitpro.shop/og-image.png";

type Meta = { title: string; description: string };

const routeMeta: Record<string, Meta> = {
  "/": {
    title: "TikProfitPro — TikTok Shop Product Research Tool",
    description:
      "Find winning TikTok Shop products with virality scores, new shops, and top creators. Start free.",
  },
  "/calculator": {
    title: "Profit Calculator — TikProfitPro",
    description:
      "Calculate your TikTok Shop product profit margins instantly, including fees and shipping costs.",
  },
  "/suppliers": {
    title: "Supplier Directory — TikProfitPro",
    description:
      "Browse verified suppliers for trending TikTok Shop products to source and sell.",
  },
  "/demo": {
    title: "Watch Demo — TikProfitPro",
    description:
      "See how TikProfitPro helps you find winning TikTok Shop products in minutes.",
  },
  "/tutorials": {
    title: "Tutorials — TikProfitPro",
    description:
      "Step-by-step video guides on product research, virality scores and listing on TikTok Shop.",
  },
  "/pricing": {
    title: "Pricing Plans — TikProfitPro",
    description:
      "Compare TikProfitPro plans: Starter, Pro, and Ultimate. Choose the right plan for your business.",
  },
  "/signup": {
    title: "Sign Up — TikProfitPro",
    description:
      "Create your free TikProfitPro account and start finding winning TikTok Shop products today.",
  },
  "/login": {
    title: "Log In — TikProfitPro",
    description:
      "Log in to your TikProfitPro account to access product research tools.",
  },
  "/terms": {
    title: "Terms of Service — TikProfitPro",
    description:
      "Read the terms of service for using TikProfitPro's TikTok Shop research platform.",
  },
  "/refund": {
    title: "Refund Policy — TikProfitPro",
    description:
      "Read TikProfitPro's refund policy for Pro and Ultimate subscription plans.",
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
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Helmet>
  );
}
