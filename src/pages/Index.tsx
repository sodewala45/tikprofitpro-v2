import { Package, Flame, TrendingUp, Eye, Loader2, Crown, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCheckout } from "@/hooks/useCheckout";

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

const labelMap: Record<string, string> = {
  total_products: "Total Products",
  hot: "Hot Products",
  rising: "Rising Products",
  watch: "Watch Products",
};

const phaseStyles: Record<string, string> = {
  hot: "border-red-500/30 bg-red-500/10 text-red-400",
  rising: "border-green-500/30 bg-green-500/10 text-green-400",
  watch: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  stable: "border-gray-500/30 bg-gray-500/10 text-gray-400",
};

const Dashboard = () => {
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ["stats"],
    queryFn: () => api.getStats(),
  });

  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.getProducts(),
  });

  const stats = statsData?.stats ?? {};
  const { checkout, loading: checkoutLoading } = useCheckout();

  const { data: userPlanData } = useQuery({
    queryKey: ["user-plan-dashboard"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return null;
      const { data } = await supabase
        .from("users")
        .select("plan")
        .eq("user_email", session.user.email)
        .maybeSingle();
      return data;
    },
  });
  const plan = userPlanData?.plan ?? productsData?.plan ?? statsData?.plan ?? "free";
  const statKeys = ["total_products", "hot", "rising", "watch"];

  const rawProducts = Array.isArray(productsData) ? productsData : productsData?.products ?? [];
  const productLimit = plan === "free" ? 10 : rawProducts.length;
  const products = rawProducts.slice(0, productLimit);
  const isFree = plan === "free";

  return (
    <div className="space-y-6 md:space-y-8 animate-slide-up pb-20 md:pb-6">
      {isFree && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-sm font-medium">
              You're on the <span className="font-bold">Free Plan</span> — showing {products.length} products. Upgrade to Pro for full access.
            </p>
          </div>
          <Link to="/pricing">
            <Button variant="outline" className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-semibold shrink-0 w-full sm:w-auto min-h-[44px]">
              Upgrade to Pro →
            </Button>
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">Track your TikTok Shop product performance</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Failed to load stats. Please try again later.
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {statKeys.map((key) => {
            const Icon = iconMap[key as keyof typeof iconMap] ?? Package;
            const value = stats?.[key];
            const change = stats?.[`${key}_change`];
            return (
              <div key={key} className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-2 md:space-y-3 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-muted-foreground">{labelMap[key]}</span>
                  <Icon className={`h-4 w-4 ${colorMap[key]}`} />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl md:text-3xl font-bold tracking-tight">
                    {value != null ? Number(value).toLocaleString() : "—"}
                  </span>
                  {change != null && <span className="text-xs text-success mb-1">{change}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Products */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm md:text-base">{isFree ? `Top ${productLimit} Trending Products` : "Trending Products"}</h2>
          <Link to="/products" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        {productsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : productsError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">Failed to load products.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Product</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Virality</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Trend</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product: any, i: number) => (
                    <tr key={product.id ?? i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium max-w-xs truncate">{product.product_name}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{product.category}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${product.virality_score ?? 0}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-7">{product.virality_score ?? 0}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={phaseStyles[product.trend_phase] ?? phaseStyles.stable}>
                          {product.trend_phase ?? "Stable"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">${product.tiktok_price ?? 0}</td>
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
                <div key={product.id ?? i} className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{product.product_name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                    <Badge variant="outline" className={`shrink-0 text-[10px] ${phaseStyles[product.trend_phase] ?? phaseStyles.stable}`}>
                      {product.trend_phase ?? "Stable"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${product.virality_score ?? 0}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{product.virality_score ?? 0}%</span>
                    </div>
                    <span className="text-sm text-muted-foreground">${product.tiktok_price ?? 0}</span>
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

      <div className="rounded-xl border border-border bg-card p-4 md:p-6">
        <h2 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { text: "New hot product detected: LED Sunset Lamp", time: "2 min ago" },
            { text: "Virality spike: Portable Blender +340%", time: "15 min ago" },
            { text: "Price drop alert: Magnetic Phone Mount", time: "1 hr ago" },
            { text: "New supplier match: Beauty Tools Co.", time: "3 hrs ago" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-2">
              <span className="text-xs md:text-sm truncate">{item.text}</span>
              <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {isFree && (
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-emerald-400 shrink-0" />
            <p className="text-sm font-medium">
              Unlock all products, supplier matching & profit calculator –{" "}
              <span className="text-emerald-400 font-semibold">Upgrade to Pro $39/mo</span>
            </p>
          </div>
          <Button onClick={() => checkout("pro")} disabled={checkoutLoading}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shrink-0 w-full sm:w-auto min-h-[44px]">
            {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade Now"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
