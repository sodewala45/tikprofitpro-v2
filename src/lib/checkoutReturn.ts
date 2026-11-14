/**
 * After paying, Lemon Squeezy sends the buyer back to /dashboard?checkout=success (redirect_url set by
 * /create-checkout). The webhook that flips users.plan can land a few seconds AFTER that, so the app
 * re-reads the plan for a while instead of showing the cached Free plan (plans audit 2026-11-14).
 * The sessionStorage mark also covers a return without the query param (old API, back button).
 */
export const CHECKOUT_STARTED_KEY = "tpp:checkoutStartedAt";
export const WATCH_INTERVAL_MS = 3_000;
export const WATCH_MAX_MS = 120_000;
const MARK_TTL_MS = 30 * 60_000;

export function markCheckoutStarted(now = Date.now()) {
  try { sessionStorage.setItem(CHECKOUT_STARTED_KEY, String(now)); } catch { /* storage unavailable */ }
}

export function clearCheckoutWatch() {
  try { sessionStorage.removeItem(CHECKOUT_STARTED_KEY); } catch { /* storage unavailable */ }
}

/** True when the user just came back from checkout and the plan should be re-read until it is paid. */
export function shouldWatchCheckout(search: string, now = Date.now()): boolean {
  if (new URLSearchParams(search).get("checkout") === "success") return true;
  try {
    const at = Number(sessionStorage.getItem(CHECKOUT_STARTED_KEY));
    return Number.isFinite(at) && at > 0 && now - at < MARK_TTL_MS;
  } catch {
    return false;
  }
}

/** The current URL without ?checkout=success (so a reload doesn't start watching again). */
export function stripCheckoutParam(href: string): string {
  const u = new URL(href);
  u.searchParams.delete("checkout");
  return u.pathname + (u.search ? u.search : "") + u.hash;
}
