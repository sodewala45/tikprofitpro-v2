/* Plans audit (2026-11-14): after paying, the app must stop showing the cached Free plan. */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, cleanup, waitFor } from "./miniRender";
import {
  CHECKOUT_STARTED_KEY, WATCH_INTERVAL_MS, clearCheckoutWatch, markCheckoutStarted, shouldWatchCheckout,
  stripCheckoutParam,
} from "@/lib/checkoutReturn";

const planState = { plan: "free", isPaid: false, isLoading: false, label: "Free" };
vi.mock("@/hooks/usePlan", async (orig) => {
  const real: any = await orig();
  return { ...real, usePlan: () => planState };
});

const users = { eqArg: "" as string };
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getSession: async () => ({ data: { session: null } }) },
    from: () => ({ select: () => ({ eq: (_c: string, v: string) => { users.eqArg = v; return { maybeSingle: async () => ({ data: { plan: "pro" } }) }; } }) }),
  },
}));

import { useCheckoutReturn } from "@/hooks/useCheckoutReturn";

beforeEach(() => { sessionStorage.clear(); window.history.replaceState(null, "", "/dashboard"); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("checkoutReturn helpers", () => {
  it("watches on ?checkout=success or a recent checkout mark", () => {
    expect(shouldWatchCheckout("?checkout=success")).toBe(true);
    expect(shouldWatchCheckout("")).toBe(false);
    markCheckoutStarted(1_000_000);
    expect(sessionStorage.getItem(CHECKOUT_STARTED_KEY)).toBe("1000000");
    expect(shouldWatchCheckout("", 1_000_000 + 60_000)).toBe(true);
    expect(shouldWatchCheckout("", 1_000_000 + 31 * 60_000)).toBe(false);   // stale mark
    clearCheckoutWatch();
    expect(shouldWatchCheckout("", 1_000_000 + 60_000)).toBe(false);
  });

  it("strips only the checkout param", () => {
    expect(stripCheckoutParam("https://x.test/dashboard?checkout=success")).toBe("/dashboard");
    expect(stripCheckoutParam("https://x.test/products?a=1&checkout=success#h")).toBe("/products?a=1#h");
  });
});

describe("loadPlan fallback", () => {
  it("lowercases the email when /me is unavailable", async () => {
    const { api } = await import("@/lib/api");
    const spy = vi.spyOn(api, "getMe").mockRejectedValue(new Error("down"));
    const { loadPlan } = await import("@/hooks/usePlan");
    const out = await loadPlan(" Hassan@Example.COM ");
    expect(users.eqArg).toBe("hassan@example.com");
    expect(out.plan).toBe("pro");
    spy.mockRestore();
  });
});

function Probe() {
  const s = useCheckoutReturn();
  return <span id="state">{s}</span>;
}
const stateText = () => document.getElementById("state")?.textContent;

describe("useCheckoutReturn", () => {
  it("stays idle without a checkout", () => {
    render(<QueryClientProvider client={new QueryClient()}><Probe /></QueryClientProvider>);
    expect(stateText()).toBe("idle");
  });

  it("re-reads the plan until it is paid, then refreshes plan-dependent data", async () => {
    Object.assign(planState, { plan: "free", isPaid: false, label: "Free" });
    window.history.replaceState(null, "", "/dashboard?checkout=success");
    markCheckoutStarted();
    const qc = new QueryClient();
    const inv = vi.spyOn(qc, "invalidateQueries");
    vi.useFakeTimers();
    render(<QueryClientProvider client={qc}><Probe /></QueryClientProvider>);
    expect(stateText()).toBe("waiting");
    await act(async () => { vi.advanceTimersByTime(WATCH_INTERVAL_MS + 10); });
    expect(inv).toHaveBeenCalledWith({ queryKey: ["user-plan"] });
    vi.useRealTimers();

    // webhook landed: the next read says Pro
    Object.assign(planState, { plan: "pro", isPaid: true, label: "Pro" });
    cleanup();
    window.history.replaceState(null, "", "/dashboard?checkout=success");
    render(<QueryClientProvider client={qc}><Probe /></QueryClientProvider>);
    await waitFor(() => expect(stateText()).toBe("done"));
    for (const key of ["credits", "products-list", "dashboard-products"]) {
      expect(inv).toHaveBeenCalledWith({ queryKey: [key] });
    }
    expect(window.location.search).toBe("");
    expect(sessionStorage.getItem(CHECKOUT_STARTED_KEY)).toBeNull();
  });

  it("gives up after the watch window and says so", async () => {
    Object.assign(planState, { plan: "free", isPaid: false, label: "Free" });
    window.history.replaceState(null, "", "/dashboard?checkout=success");
    vi.useFakeTimers();
    render(<QueryClientProvider client={new QueryClient()}><Probe /></QueryClientProvider>);
    await act(async () => { vi.advanceTimersByTime(121_000); });
    expect(stateText()).toBe("timeout");
  });
});

describe("api.createCheckout", () => {
  it("marks the checkout before leaving for Lemon Squeezy", async () => {
    const { api } = await import("@/lib/api");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ success: true, checkout_url: "https://store.lemonsqueezy.com/checkout/custom/abc" }),
      { status: 200, headers: { "Content-Type": "application/json" } }));
    const loc = window.location;
    // jsdom can't navigate; capture the assignment instead
    Object.defineProperty(window, "location", { configurable: true, value: { ...loc, href: loc.href } });
    try {
      await api.createCheckout("pro");
      expect(sessionStorage.getItem(CHECKOUT_STARTED_KEY)).not.toBeNull();
      expect(window.location.href).toBe("https://store.lemonsqueezy.com/checkout/custom/abc");
    } finally {
      Object.defineProperty(window, "location", { configurable: true, value: loc });
      fetchSpy.mockRestore();
    }
  });
});
