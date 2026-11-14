import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export type Plan = "free" | "pro" | "ultimate";

/** React Query key prefix for the plan; invalidate it to re-read the plan (e.g. after checkout). */
export const PLAN_QUERY_KEY = "user-plan";

const asPlan = (raw: unknown): Plan => {
  const p = (raw ?? "free").toString().trim().toLowerCase(); // same as the API's normalize_plan
  return p === "pro" || p === "ultimate" ? (p as Plan) : "free";
};

/**
 * The plan the API applies to this user, read from GET /me. Admins count as Ultimate there
 * (they used to see the Free top 10 because only users.plan was read). If /me isn't deployed yet
 * or fails, falls back to users.plan from Supabase as before.
 * Every page uses this hook so the dashboard, sidebar, products and settings never disagree.
 * NOTE: this is display only. Real access control is enforced server-side.
 */
export async function loadPlan(email: string): Promise<{ plan: Plan; billingPlan: Plan; admin: boolean }> {
  try {
    const me = await api.getMe();
    if (me && typeof me.plan === "string") {
      return { plan: asPlan(me.plan), billingPlan: asPlan(me.billing_plan ?? me.plan), admin: !!me.admin };
    }
  } catch { /* old API without /me, or offline: use the stored plan */ }
  // users.user_email is stored lowercased; the auth email may not be.
  const { data } = await supabase.from("users").select("plan").eq("user_email", email.trim().toLowerCase()).maybeSingle();
  const plan = asPlan(data?.plan);
  return { plan, billingPlan: plan, admin: false };
}

export function usePlan() {
  const { user, loading: authLoading } = useAuth();
  const { data, isPending } = useQuery({
    queryKey: [PLAN_QUERY_KEY, user?.email],
    queryFn: () => (user?.email ? loadPlan(user.email) : null),
    enabled: !!user?.email,
    staleTime: 60_000,
  });
  const plan: Plan = data?.plan ?? "free";
  const label = plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Ultimate";
  // Loading until the session is known and, when signed in, the plan has arrived, so callers
  // can show a skeleton instead of flashing the Free plan before Pro.
  const isLoading = authLoading || (!!user?.email && isPending);
  return {
    plan, label, isFree: plan === "free", isPaid: plan !== "free", isLoading,
    // Stored plan (what Lemon Squeezy bills). Differs from `plan` only for admins.
    billingPlan: (data?.billingPlan ?? "free") as Plan,
    isAdmin: !!data?.admin,
  };
}
