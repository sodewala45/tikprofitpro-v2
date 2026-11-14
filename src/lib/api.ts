import { supabase } from "@/lib/supabase";
import { safeUrl } from "@/lib/safeUrl";
import { markCheckoutStarted } from "@/lib/checkoutReturn";

const BASE_URL = "https://api.tikprofitpro.shop";

const API_KEY = "88f6c492c9fcde83687bce9d9cce0b03fdd5b84ca962de228e0dc4ad5d2bad20";

/** Messages shown to users. Raw backend text (stack traces, DB errors) is never shown. */
export const API_MESSAGES = {
  signIn: "Please sign in to continue.",
  upgrade: "This is available on paid plans. Upgrade to unlock it.",
  rateLimited: "Too many requests, try again in a minute.",
  server: "Something went wrong, please try again.",
  network: "Couldn't reach the server. Check your connection and try again.",
  forbidden: "You don't have access to this.",
  generic: "Request failed. Please try again.",
} as const;

export type ApiErrorKind = "auth" | "upgrade" | "confirm_email" | "forbidden" | "rate_limit" | "server" | "network" | "other";

/**
 * Error thrown by every API call. `message` is always safe to show to users.
 * `detail` keeps the parsed JSON `detail` (string or object, e.g. {code: "no_credits"})
 * for callers that branch on it; never render it directly.
 */
export class ApiError extends Error {
  status: number;
  kind: ApiErrorKind;
  detail: unknown;
  code?: string;

  constructor(message: string, opts: { status: number; kind: ApiErrorKind; detail?: unknown; code?: string }) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.kind = opts.kind;
    this.detail = opts.detail;
    this.code = opts.code;
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

// Anything that looks like an internal error rather than a sentence meant for users.
const LEAKY = /traceback|exception|stack|psycopg|postgres|postgrest|sqlstate|syntax error|relation "|column "|duplicate key|violates|errno|\.py\b|line \d+|<html|supabase\.co|https?:\/\/\S+\/rest\//i;

/** Returns text only if it reads like a short, user-facing message. */
function userText(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  if (!t || t.length > 240 || LEAKY.test(t)) return undefined;
  return t;
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: unknown = undefined;
  try {
    const text = await res.text();
    try { body = JSON.parse(text); } catch { body = undefined; } // non-JSON bodies are never shown
  } catch { /* ignore */ }

  const detail: unknown = body && typeof body === "object" ? (body as Record<string, unknown>).detail : undefined;
  const obj = detail && typeof detail === "object" ? (detail as Record<string, unknown>) : undefined;
  const code: string | undefined = typeof obj?.code === "string" ? obj.code : undefined;
  const detailText = userText(detail) ?? (obj ? userText(obj.message) ?? userText(obj.detail) : undefined);

  const status = res.status;
  if (status === 401) return new ApiError(API_MESSAGES.signIn, { status, kind: "auth", detail, code });
  if (status === 403) {
    if (code === "email_unconfirmed" || (detailText && /confirm.*email/i.test(detailText))) {
      return new ApiError(detailText ?? "Confirm your email to use credits.", { status, kind: "confirm_email", detail, code });
    }
    // Plan gates (e.g. a product outside the free top 10) -> upgrade prompt with the server's text.
    if (!detailText || /upgrade|\bpro\b|plan|paid/i.test(detailText)) {
      return new ApiError(detailText ?? API_MESSAGES.upgrade, { status, kind: "upgrade", detail, code });
    }
    // Bare "Forbidden" / "Admins only" and similar.
    const text = /^forbidden\.?$/i.test(detailText) ? API_MESSAGES.forbidden : detailText;
    return new ApiError(text, { status, kind: "forbidden", detail, code });
  }
  if (status === 429) {
    // Server texts like "An Amazon search is already running for you" are friendlier than the generic one.
    const text = detailText && !/rate limit exceeded/i.test(detailText) ? detailText : API_MESSAGES.rateLimited;
    return new ApiError(text, { status, kind: "rate_limit", detail, code });
  }
  // 402 = payment required. no_credits keeps its own handling; any other 402 (e.g. "The listing
  // generator is a Pro feature") is a plan gate, so callers show an upgrade link.
  if (status === 402 && code !== "no_credits") {
    return new ApiError(detailText ?? API_MESSAGES.upgrade, { status, kind: "upgrade", detail, code });
  }
  // 502/503 carry deliberate, actionable server text (e.g. "GitHub token is wrong or expired",
  // "Credits are temporarily unavailable"); show it when it passes the leak filter. 500s stay generic.
  if ((status === 502 || status === 503) && detailText) return new ApiError(detailText, { status, kind: "server", detail, code });
  if (status >= 500) return new ApiError(API_MESSAGES.server, { status, kind: "server", detail, code });
  return new ApiError(detailText ?? API_MESSAGES.generic, { status, kind: "other", detail, code });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- responses are untyped across the app
async function send(path: string, init: RequestInit): Promise<any> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, init);
  } catch {
    throw new ApiError(API_MESSAGES.network, { status: 0, kind: "network" });
  }
  if (!res.ok) throw await toApiError(res);
  return res.json();
}

async function apiFetch(path: string, options?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
    ...options?.headers as Record<string, string>,
  };

  if (session?.access_token) {
    headers["Authorization"] = "Bearer " + session.access_token;
  }

  return send(path, { ...options, headers });
}

async function apiUpload(path: string, form: FormData) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "X-API-Key": API_KEY };
  if (session?.access_token) headers["Authorization"] = "Bearer " + session.access_token;
  return send(path, { method: "POST", body: form, headers });
}

export const CHECKOUT_PLANS = ["pro", "ultimate"] as const;
export type CheckoutPlan = (typeof CHECKOUT_PLANS)[number];
export const isCheckoutPlan = (p: unknown): p is CheckoutPlan =>
  typeof p === "string" && (CHECKOUT_PLANS as readonly string[]).includes(p);

export const api = {
  // Effective plan for the UI: admins (ADMIN_EMAILS / ADMIN_USER_IDS on the API) are "ultimate";
  // billing_plan is the stored users.plan that credits and Lemon Squeezy use.
  getMe: () => apiFetch("/me"),
  getStats: () => apiFetch("/stats"),
  getProducts: (params?: Record<string, string>) =>
    apiFetch(`/products?${new URLSearchParams(params)}`),
  // /search defaults to 20 rows server-side; ask for the max so paid search isn't silently cut at 20.
  searchProducts: (query: string, limit = 100) =>
    apiFetch(`/search?${new URLSearchParams({ q: query, limit: String(limit) })}`),
  calcProfit: (data: object) =>
    apiFetch("/calculate-profit", { method: "POST", body: JSON.stringify(data) }),
  getSuppliers: (product_id: string, platform: string) =>
    apiFetch(`/products/${product_id}/suppliers/${platform}`),
  getCredits: () => apiFetch("/credits"),
  getSourcingJob: (jobId: number) => apiFetch(`/sourcing/jobs/${jobId}`),
  // The server looks up the product's stored image from product_id; never send an image URL.
  generateListing: (data: { product_id: string; product_name: string; price: number; category: string }) =>
    apiFetch("/generate-listing", { method: "POST", body: JSON.stringify(data) }),
  getShops: (params?: Record<string, string>) =>
    apiFetch(`/shops?${new URLSearchParams(params)}`),
  // Shops behind the current product list: product count, revenue share, growth, top products.
  getCatalogueShops: (params?: Record<string, string>) =>
    apiFetch(`/shops/catalogue?${new URLSearchParams(params)}`),
  getCreators: (params?: Record<string, string>) =>
    apiFetch(`/creators?${new URLSearchParams(params)}`),
  // Admin: supplier review queue
  adminMe: () => apiFetch("/admin/me"),
  adminQueue: (view: string, platform?: string) =>
    apiFetch(`/admin/review/queue?${new URLSearchParams({ view, ...(platform ? { platform } : {}) })}`),
  adminProduct: (productId: string) => apiFetch(`/admin/review/products/${productId}`),
  adminApprove: (id: number) => apiFetch(`/admin/candidates/${id}/approve`, { method: "POST" }),
  adminReject: (id: number) => apiFetch(`/admin/candidates/${id}/reject`, { method: "POST" }),
  adminReopen: (id: number) => apiFetch(`/admin/candidates/${id}/reopen`, { method: "POST" }),
  adminSetHidden: (supplierId: number, hidden: boolean) =>
    apiFetch(`/admin/suppliers/${supplierId}/visibility`, { method: "POST", body: JSON.stringify({ hidden }) }),
  adminImport: (files: File[], opts: { dryRun: boolean; deactivate: boolean }) => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    form.append("dry_run", String(opts.dryRun));
    form.append("deactivate", String(opts.deactivate));
    form.append("rehost", "true");
    return apiUpload("/admin/import", form);
  },
  adminImportStatus: (jobId: string) => apiFetch(`/admin/import/${jobId}`),
  adminImports: () => apiFetch("/admin/import"),
  adminSourcingRun: (data: { mode: "new" | "all"; max_requests: number; limit?: number }) =>
    apiFetch("/admin/sourcing/run", { method: "POST", body: JSON.stringify(data) }),
  adminSourcingRuns: () => apiFetch("/admin/sourcing/runs"),
  adminAddSupplier: (data: object) =>
    apiFetch("/admin/suppliers", { method: "POST", body: JSON.stringify(data) }),
  createCheckout: async (plan: string) => {
    if (!isCheckoutPlan(plan)) throw new ApiError("Unknown plan. Pick a plan on the pricing page.", { status: 0, kind: "other" });
    const { data: { session } } = await supabase.auth.getSession();
    const data = await apiFetch("/create-checkout", {
      method: "POST",
      body: JSON.stringify({ email: session?.user?.email ?? '', plan }),
    });
    const checkoutUrl = safeUrl(data?.checkout_url ?? data?.url);
    if (!checkoutUrl || new URL(checkoutUrl).protocol !== "https:") {
      throw new ApiError(API_MESSAGES.server, { status: 0, kind: "server" });
    }
    // Every Upgrade path (sidebar, dashboard, Pricing, Signup/Login) ends here: mark it so the app
    // re-reads the plan on return until the webhook has made the account paid.
    markCheckoutStarted();
    window.location.href = checkoutUrl;
  },
};
