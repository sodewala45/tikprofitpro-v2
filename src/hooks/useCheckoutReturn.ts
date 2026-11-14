import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePlan, PLAN_QUERY_KEY } from "@/hooks/usePlan";
import {
  WATCH_INTERVAL_MS, WATCH_MAX_MS, clearCheckoutWatch, shouldWatchCheckout, stripCheckoutParam,
} from "@/lib/checkoutReturn";

export type CheckoutReturnState = "idle" | "waiting" | "done" | "timeout";

/** Re-reads the plan every few seconds after a checkout until it turns paid (or 2 minutes pass). */
export function useCheckoutReturn(): CheckoutReturnState {
  const qc = useQueryClient();
  const { isPaid, isLoading } = usePlan();
  const [state, setState] = useState<CheckoutReturnState>(() =>
    typeof window !== "undefined" && shouldWatchCheckout(window.location.search) ? "waiting" : "idle");

  useEffect(() => {
    if (state !== "waiting" || isLoading || !isPaid) return;
    clearCheckoutWatch();
    // Plan-dependent data fetched while still Free: credits (5 -> 50) and the top-10 lists.
    for (const key of ["credits", "user-credits-nav", "products-list", "dashboard-products"]) {
      qc.invalidateQueries({ queryKey: [key] });
    }
    try { window.history.replaceState(window.history.state, "", stripCheckoutParam(window.location.href)); } catch { /* ignore */ }
    setState("done");
  }, [state, isPaid, isLoading, qc]);

  useEffect(() => {
    if (state !== "waiting") return;
    const tick = setInterval(() => qc.invalidateQueries({ queryKey: [PLAN_QUERY_KEY] }), WATCH_INTERVAL_MS);
    const stop = setTimeout(() => { clearCheckoutWatch(); setState((s) => (s === "waiting" ? "timeout" : s)); }, WATCH_MAX_MS);
    return () => { clearInterval(tick); clearTimeout(stop); };
  }, [state, qc]);

  return state;
}
