export const SITE = "https://tikprofitpro.shop";
export const OG_IMAGE = "https://tikprofitpro.shop/og-image.png";

export type RouteMeta = {
  title: string;
  description: string;
  /** Short unique summary rendered into the static HTML so crawlers see distinct content. */
  heading: string;
  body: string;
};

export const routeMeta: Record<string, RouteMeta> = {
  "/": {
    title: "TikProfitPro — TikTok Shop Product Research Tool",
    description:
      "Find winning TikTok Shop products with virality scores, new shops, and top creators. Start free.",
    heading: "TikTok Shop product research",
    body: "TikProfitPro tracks trending TikTok Shop products, virality scores, new shops and top creators so US sellers can spot winners early, source them from verified suppliers and check margins before listing.",
  },
  "/calculator": {
    title: "Profit Calculator — TikProfitPro",
    description:
      "Calculate your TikTok Shop product profit margins instantly, including fees and shipping costs.",
    heading: "TikTok Shop profit calculator",
    body: "Enter selling price, product cost, shipping and the TikTok referral fee to see net profit, margin and profit per order instantly for any quantity.",
  },
  "/suppliers": {
    title: "Supplier Directory — TikProfitPro",
    description:
      "Browse verified suppliers for trending TikTok Shop products to source and sell.",
    heading: "Verified supplier directory",
    body: "Search Alibaba, AliExpress and Amazon suppliers matched to trending TikTok Shop products, compare unit prices and minimum orders, then open the supplier listing directly.",
  },
  "/demo": {
    title: "Watch Demo — TikProfitPro",
    description:
      "See how TikProfitPro helps you find winning TikTok Shop products in minutes.",
    heading: "Product demo",
    body: "A short walkthrough of the TikProfitPro dashboard: product discovery, virality scoring, shop and creator data, supplier matching and the profit calculator.",
  },
  "/tutorials": {
    title: "Tutorials — TikProfitPro",
    description:
      "Step-by-step video guides on product research, virality scores and listing on TikTok Shop.",
    heading: "Video tutorials",
    body: "Watch step-by-step guides covering product research workflows, reading virality scores, finding suppliers and preparing a TikTok Shop listing end to end.",
  },
  "/pricing": {
    title: "Pricing Plans — TikProfitPro",
    description:
      "Compare TikProfitPro plans: Starter, Pro, and Ultimate. Choose the right plan for your business.",
    heading: "Plans and pricing",
    body: "Compare the free Starter plan with Pro and Ultimate subscriptions: search credits, supplier lookups, creator and shop analytics, and monthly billing options.",
  },
  "/signup": {
    title: "Sign Up — TikProfitPro",
    description:
      "Create your free TikProfitPro account and start finding winning TikTok Shop products today.",
    heading: "Create your account",
    body: "Sign up free with email or Google to get starter search credits and begin researching trending TikTok Shop products right away.",
  },
  "/login": {
    title: "Log In — TikProfitPro",
    description:
      "Log in to your TikProfitPro account to access product research tools.",
    heading: "Log in",
    body: "Sign in to your TikProfitPro account to reach your saved research, remaining credits, supplier lookups and the profit calculator.",
  },
  "/terms": {
    title: "Terms of Service — TikProfitPro",
    description:
      "Read the terms of service for using TikProfitPro's TikTok Shop research platform.",
    heading: "Terms of service",
    body: "The terms governing use of TikProfitPro: account rules, acceptable use, subscription billing, data accuracy disclaimers and limits of liability.",
  },
  "/refund": {
    title: "Refund Policy — TikProfitPro",
    description:
      "Read TikProfitPro's refund policy for Pro and Ultimate subscription plans.",
    heading: "Refund policy",
    body: "How refunds work for Pro and Ultimate subscriptions, including eligibility windows, how to request a refund and how cancellations affect billing.",
  },
};
