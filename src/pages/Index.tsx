import { Package, Flame, TrendingUp, Eye, Loader2, Crown, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCheckout } from "@/hooks/useCheckout";
import { safeImageSrc } from "@/lib/safeUrl";
import { usePlan } from "@/hooks/usePlan";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice, normalizeStage } from "@/lib/productFormat";

const iconMap = {
  total_products: Package,
  hot: Flame,
  rising: TrendingUp,
  watch: Eye,
};

const colorMap: Record<string, string> = {
  total_products: "text-primary",
  hot: "text-destructive",
  rising: "text-success",
  watch: "text-warning",
};

const bgColorMap: Record<string, string> = {
  total_products: "bg-primary/10",
  hot: "bg-destructive/10",
  rising: "bg-success/10",
  watch: "bg-warning/10",
};

// /stats buckets are virality-score ranges, not life-cycle stages, so they're labelled by score.
// "Rising" etc. are reserved for the stage shown on each product (same as the Products page).
const labelMap: Record<string, string> = {
  total_products: "Total Products",
  hot: "Score 80+",
  rising: "Score 65–79",
  watch: "Score 50–64",
};

// Same stage names as the Products page. The DB stores v1 names (hot/rising/watch/pass);
// normalizeStage maps them back (hot→emerging, pass→saturated) so "pass" no longer shows as "New data".
const STAGE_LABELS: Record<string, string> = {
  emerging: "Emerging", rising: "Rising", peaking: "Peaking", saturated: "Saturated",
  watch: "Watch", stable: "Stable", unknown: "New data",
};
const stageLabel = (phase?: string) => STAGE_LABELS[normalizeStage(phase)] ?? "New data";
const stageStyle = (phase?: string) => phaseStyles[normalizeStage(phase)] ?? phaseStyles.stable;

const phaseStyles: Record<string, string> = {
  emerging: "border-border bg-violet-50 text-violet-700",
  rising: "border-border bg-emerald-50 text-emerald-700",
  peaking: "border-border bg-amber-50 text-amber-700",
  saturated: "border-border bg-red-50 text-red-600",
  watch: "border-border bg-amber-50 text-amber-700",
  stable: "border-gray-500/30 bg-gray-500/10 text-gray-500",
};

const Dashboard = () => {
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.getStats(),
  });

  // Wait for the session so the first request isn't sent signed-out (which returns the free top 10).
  const { user, loading: authLoading } = useAuth();
  const { plan, isLoading: planLoading } = usePlan();
  // Plan in the key: the Free top 10 must not be reused once this user is Pro (plans audit 2026-11-14).
  const { data: productsData, isLoading: productsQueryLoading, error: productsError } = useQuery({
    queryKey: ["dashboard-products", user?.id ?? "anon", plan],
    queryFn: () => api.getProducts(),
    enabled: !authLoading && !planLoading,
  });

  const stats = statsData?.stats ?? {};
  const { checkout, loading: checkoutLoading } = useCheckout();

  const statKeys = ["total_products", "hot", "rising", "watch"];
  const productsLoading = authLoading || planLoading || productsQueryLoading;

  const rawProducts = Array.isArray(productsData) ? productsData : productsData?.products ?? [];
  // Show nothing plan-specific until the plan is known, so Pro users never see a Free flash.
  const isFree = !planLoading && plan === "free";
  const productLimit = isFree ? 10 : rawProducts.length;
  const products = rawProducts.slice(0, productLimit);

  return (
    <div className="space-y-6 md:space-y-8 animate-slide-up pb-20 md:pb-6">
      {isFree && (
        <div className="rounded-lg border border-border bg-amber-50 p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-sm font-medium">
              You're on the <span className="font-bold">Free Plan</span>, which shows the top 10 products. Upgrade to Pro for the full list and search.
            </p>
          </div>
          <Link to="/pricing">
            <Button variant="outline" className="border-amber-500/40 text-amber-700 hover:bg-amber-50 font-semibold shrink-0 w-full sm:w-auto min-h-[44px]">
              Upgrade to Pro →
            </Button>
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Track your TikTok Shop product performance</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Failed to load stats. Please try again later.
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {statKeys.map((key) => {
            const Icon = iconMap[key as keyof typeof iconMap] ?? Package;
            const value = stats?.[key];
            const change = stats?.[`${key}_change`];
            return (
              <div key={key} className="rounded-lg border border-border bg-card p-4 md:p-5 space-y-3 md:space-y-4 hover:border-primary/40  transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-sm md:text-base font-medium text-muted-foreground">{labelMap[key]}</span>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${bgColorMap[key]}`}>
                    <Icon className={`h-4 w-4 ${colorMap[key]}`} />
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl md:text-4xl font-bold tracking-tight">
                    {value != null ? Number(value).toLocaleString() : "—"}
                  </span>
                  {change != null && <span className="text-sm text-success mb-1">{change}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Products */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-base md:text-lg">{isFree ? `Top ${productLimit} Trending Products` : "Trending Products"}</h2>
          <Link to="/products" className="text-sm text-primary hover:underline font-medium">View all →</Link>
        </div>
        {productsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : productsError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">Failed to load products.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm md:text-base">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Product</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Category</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Virality</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Trend</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product: any, i: number) => (
                    <tr key={product.id ?? i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4 font-semibold max-w-xs">
                        <div className="flex items-center gap-3">
                          {safeImageSrc(product.thumbnail_url) ? (
                            <img
                              src={safeImageSrc(product.thumbnail_url)}
                              alt={product.product_name}
                              className="w-11 h-11 rounded-lg object-cover shrink-0 border border-border"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = "none";
                                const fallback = img.nextElementSibling as HTMLElement | null;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="w-11 h-11 rounded-lg bg-muted/50 shrink-0 items-center justify-center text-base border border-border"
                            style={{ display: safeImageSrc(product.thumbnail_url) ? "none" : "flex" }}
                          >
                            <Package className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                          </div>
                          <span className="truncate">{product.product_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground text-sm">{product.category}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${product.virality_score ?? 0}%` }} />
                          </div>
                          <span className="text-sm font-medium text-muted-foreground w-9">{product.virality_score ?? 0}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className={stageStyle(product.trend_phase)}>
                          {stageLabel(product.trend_phase)}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-medium">{formatPrice(product)}</td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No products found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {products.map((product: any, i: number) => (
                <div key={product.id ?? i} className="rounded-lg border border-border bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {safeImageSrc(product.thumbnail_url) ? (
                        <img
                          src={safeImageSrc(product.thumbnail_url)}
                          alt={product.product_name}
                          className="w-11 h-11 rounded-lg object-cover shrink-0 border border-border"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = "none";
                            const fallback = img.nextElementSibling as HTMLElement | null;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="w-11 h-11 rounded-lg bg-muted/50 shrink-0 items-center justify-center text-base border border-border"
                        style={{ display: safeImageSrc(product.thumbnail_url) ? "none" : "flex" }}
                      >
                        <Package className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm md:text-base truncate">{product.product_name}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{product.category}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`shrink-0 text-[10px] ${stageStyle(product.trend_phase)}`}>
                      {stageLabel(product.trend_phase)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${product.virality_score ?? 0}%` }} />
                      </div>
                      <span className="text-sm text-muted-foreground">{product.virality_score ?? 0}%</span>
                    </div>
                    <span className="text-sm md:text-base font-medium text-muted-foreground">{formatPrice(product)}</span>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-sm">No products found</div>
              )}
            </div>
          </>
        )}
      </div>

      {isFree && (
        <div className="rounded-lg border border-border bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-emerald-700 shrink-0" />
            <p className="text-sm font-medium">
              Unlock the full product list, search and 50 sourcing credits a month –{" "}
              <span className="text-emerald-700 font-semibold">Upgrade to Pro $39/mo</span>
            </p>
          </div>
          <Button onClick={() => checkout("pro")} disabled={checkoutLoading}
            className="bg-foreground text-background hover:opacity-90 font-semibold shrink-0 w-full sm:w-auto min-h-[44px]">
            {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade Now"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
