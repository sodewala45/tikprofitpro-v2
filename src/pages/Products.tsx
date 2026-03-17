import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Loader2, X, TrendingUp, ShoppingCart, Users, Star, Factory, AlertTriangle, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";


const phaseStyles: Record<string, string> = {
  hot: "border-red-500/30 bg-red-500/10 text-red-400",
  rising: "border-green-500/30 bg-green-500/10 text-green-400",
  watch: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  stable: "border-gray-500/30 bg-gray-500/10 text-gray-400",
};

const profitColor = (label?: string) => {
  if (!label) return "text-muted-foreground";
  const l = label.toLowerCase();
  if (l.includes("high") || l.includes("good")) return "text-green-400";
  if (l.includes("medium") || l.includes("moderate")) return "text-amber-400";
  return "text-red-400";
};

const platforms = [
  { id: "alibaba", label: "Alibaba", cost: "1 credit", color: "bg-[#E8650A] text-white hover:bg-[#C25408] border-none cursor-pointer opacity-100 rounded-lg p-3" },
  { id: "aliexpress", label: "AliExpress", cost: "1 credit", color: "bg-[#CC0000] text-white hover:bg-[#A30000] border-none cursor-pointer opacity-100 rounded-lg p-3" },
  { id: "amazon", label: "Amazon", cost: "1 credit", color: "bg-[#FF9900] text-black hover:bg-[#D98200] border-none cursor-pointer opacity-100 rounded-lg p-3" },
];

const Products = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [supplierProduct, setSupplierProduct] = useState<any>(null);
  const [supplierPlatform, setSupplierPlatform] = useState<string | null>(null);
  const [supplierResults, setSupplierResults] = useState<any[] | null>(null);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierError, setSupplierError] = useState<string | null>(null);

  const { data: creditsData } = useQuery({
    queryKey: ["credits"],
    queryFn: () => api.getCredits(),
    retry: false,
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["products", debouncedSearch],
    queryFn: () =>
      debouncedSearch
        ? api.searchProducts(debouncedSearch)
        : api.getProducts({ limit: "100" }),
  });

  const productsRaw = products as any;
  const plan = productsRaw?.plan ?? creditsData?.plan ?? "free";
  const items = Array.isArray(products) ? products : productsRaw?.products ?? [];
  const isFree = plan === "free";
  const visibleItems = isFree ? items.slice(0, 10) : items.slice(0, 100);
  const totalPages = Math.ceil(visibleItems.length / ITEMS_PER_PAGE);
  const paginatedItems = visibleItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset to page 1 when search changes
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);

  const formatNumber = (n: number) => {
    if (!n) return "0";
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const handleFindSupplier = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSupplierProduct(product);
    setSupplierPlatform(null);
    setSupplierResults(null);
    setSupplierError(null);
  };

  const handleSearchPlatform = async (platform: string) => {
    setSupplierPlatform(platform);
    setSupplierLoading(true);
    setSupplierResults(null);
    setSupplierError(null);
    try {
      const data = await api.getSuppliers(supplierProduct.id, platform);
      if (data?.error?.includes("No credits")) {
        setSupplierError("no_credits");
      } else {
        const results = data?.suppliers ?? data?.results ?? (Array.isArray(data) ? data : []);
        const sliced = results.slice(0, 3);
        setSupplierResults(sliced);
        queryClient.invalidateQueries({ queryKey: ["user-credits-nav"] });
        queryClient.invalidateQueries({ queryKey: ["credits"] });
      }
    } catch (err: any) {
      if (err?.message?.includes("403")) {
        setSupplierError("upgrade");
      } else if (err?.message?.toLowerCase()?.includes("credit")) {
        setSupplierError("no_credits");
      } else {
        setSupplierError(err?.message || "Failed to search suppliers");
      }
    } finally {
      setSupplierLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground mt-1 text-sm">Browse and search trending TikTok Shop products</p>
      </div>

      <div className="relative max-w-full md:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products, categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-border"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Failed to load products. Please try again later.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Virality</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Trend</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Supplier</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((product: any, i: number) => (
                  <tr
                    key={product.id ?? product.product_name ?? i}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <td className="py-3 px-4 font-medium max-w-xs truncate">{product.product_name}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs max-w-xs truncate">{product.category}</td>
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
                    <td className="py-3 px-4">
                      <Button variant="outline" size="sm" className="text-xs border-primary/30 text-primary hover:bg-primary/10 min-h-[44px] md:min-h-0" onClick={(e) => handleFindSupplier(product, e)}>
                        <Factory className="h-3 w-3 mr-1" />
                        Find Supplier
                      </Button>
                    </td>
                  </tr>
                ))}
                {paginatedItems.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No products found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {paginatedItems.map((product: any, i: number) => (
              <div
                key={product.id ?? product.product_name ?? i}
                className="rounded-xl border border-border bg-card p-4 space-y-3 cursor-pointer active:bg-muted/20 transition-colors"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{product.product_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{product.category}</p>
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
                <Button variant="outline" size="sm" className="w-full text-xs border-primary/30 text-primary hover:bg-primary/10 min-h-[44px]" onClick={(e) => handleFindSupplier(product, e)}>
                  <Factory className="h-3 w-3 mr-1" />
                  Find Supplier
                </Button>
              </div>
            ))}
            {paginatedItems.length === 0 && (
              <div className="py-8 text-center text-muted-foreground text-sm">No products found</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, visibleItems.length)} of {visibleItems.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8 p-0 text-xs"
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Supplier Search Modal */}
      {supplierProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-4" onClick={() => setSupplierProduct(null)}>
          <div className="bg-card border border-border rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[95vh] md:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-border sticky top-0 bg-card z-10">
              <div className="min-w-0">
                <h2 className="font-semibold text-base">Find Supplier</h2>
                <p className="text-xs text-muted-foreground mt-1 truncate">{supplierProduct.product_name}</p>
              </div>
              <button onClick={() => setSupplierProduct(null)} className="text-muted-foreground hover:text-foreground p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              <p className="text-sm text-muted-foreground">Choose a platform to search:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {platforms.map((p) => (
                  <Button
                    key={p.id}
                    variant="outline"
                    className={`flex flex-col h-auto py-3 font-semibold min-h-[44px] ${p.color} ${supplierPlatform === p.id ? "ring-2 ring-offset-1 ring-offset-background" : ""}`}
                    onClick={() => handleSearchPlatform(p.id)}
                    disabled={supplierLoading}
                  >
                    <span className="text-xs font-medium">{p.label}</span>
                    <span className="text-[10px] opacity-70">{isFree ? "Free preview" : p.cost}</span>
                  </Button>
                ))}
              </div>

              {supplierLoading && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Searching suppliers… this can take 15–30 seconds</p>
                </div>
              )}

              {supplierError === "upgrade" && (
                <div className="text-center py-4 space-y-2">
                  <p className="text-sm text-amber-400">Supplier sourcing requires a paid plan.</p>
                  <Link to="/pricing"><Button size="sm" className="bg-primary text-primary-foreground min-h-[44px]">Upgrade →</Button></Link>
                </div>
              )}

              {supplierError === "no_credits" && (
                <div className="text-center py-4 space-y-2">
                  <p className="text-sm text-amber-400">You've used all your credits this month.</p>
                  <p className="text-xs text-muted-foreground">Upgrade your plan for more credits.</p>
                  <Link to="/pricing"><Button size="sm" className="bg-primary text-primary-foreground min-h-[44px]">Upgrade →</Button></Link>
                </div>
              )}

              {supplierError && supplierError !== "upgrade" && supplierError !== "no_credits" && (
                <div className="text-center py-4">
                  <p className="text-sm text-destructive">{supplierError}</p>
                </div>
              )}

              {supplierResults && supplierResults.length > 0 && (
                <div className="space-y-3 mt-2">
                  <p className="text-xs text-muted-foreground font-medium">Top {supplierResults.length} suppliers:</p>
                  {supplierResults.map((s: any, i: number) => {
                    const ratingColor = s._profit?.rating === "green" ? "text-green-400" : s._profit?.rating === "amber" ? "text-amber-400" : s._profit?.rating === "red" ? "text-red-400" : "text-muted-foreground";
                    return (
                      <div key={i} className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate max-w-[70%]">
                            <span className="text-sm font-medium truncate">{isFree ? (supplierProduct?.product_name || `Supplier ${i + 1}`) : (s.supplier_name || s.name || `Supplier ${i + 1}`)}</span>
                            {s.whitelabel_available && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Whitelabel</Badge>}
                          </div>
                          <span className={`text-xs font-semibold ${ratingColor}`}>{s._profit?.profit_label || "—"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>Unit Cost: <span className="text-foreground font-medium">${s.unit_cost_min ?? "—"}</span></div>
                          <div>MOQ: <span className="text-foreground font-medium">{s.moq ?? "—"}</span></div>
                          <div>Shipping: <span className="text-foreground font-medium">{s.shipping_estimate_days ?? "—"} days</span></div>
                          <div>Profit: <span className="text-foreground font-medium">${s._profit?.net_profit ?? "—"}</span></div>
                        </div>
                        {s._profit?.margin_pct != null && (
                          <div className="text-xs">
                            Margin: <span className={`font-semibold ${ratingColor}`}>{s._profit.margin_pct}%</span>
                          </div>
                        )}
                        {/* Gated supplier link */}
                        {isFree ? (
                          <div className="pt-1">
                            <Link to="/pricing" className="block w-full">
                              <button
                                style={{
                                  background: "linear-gradient(135deg, #00C853, #00BCD4)",
                                  boxShadow: "0 0 12px rgba(0, 200, 83, 0.4)",
                                  borderRadius: "8px",
                                  padding: "10px 16px",
                                  border: "none",
                                  cursor: "pointer",
                                  width: "100%",
                                  minHeight: "44px",
                                  color: "white",
                                  fontWeight: "bold",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  transition: "filter 0.2s ease, transform 0.2s ease",
                                }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)";
                                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)";
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1)";
                                  (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                                }}
                              >
                                <span className="flex items-center gap-1.5">
                                  <Lock className="h-3.5 w-3.5" />
                                  Upgrade to View Supplier
                                </span>
                                <span>→</span>
                              </button>
                            </Link>
                          </div>
                        ) : (
                          s.supplier_url && (
                            <a href={s.supplier_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View Supplier →</a>
                          )
                        )}
                      </div>
                    );
                  })}

                  {/* Upgrade CTA for free users after results */}
                  {isFree && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center space-y-2">
                      <p className="text-sm text-muted-foreground">Upgrade to Pro to view supplier links and start sourcing</p>
                    </div>
                  )}
                </div>
              )}

              {supplierResults && supplierResults.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">No suppliers found for this platform.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && !supplierProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-card border border-border rounded-t-2xl md:rounded-2xl w-full md:max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-4 md:p-6 border-b border-border sticky top-0 bg-card z-10">
              <div className="flex gap-3 md:gap-4 min-w-0">
                {selectedProduct.thumbnail_url && (
                  <img src={selectedProduct.thumbnail_url} alt={selectedProduct.product_name} className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm md:text-base leading-snug truncate">{selectedProduct.product_name}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{selectedProduct.category}</p>
                  <Badge variant="outline" className={`mt-2 ${phaseStyles[selectedProduct.trend_phase] ?? phaseStyles.stable}`}>
                    {selectedProduct.trend_phase ?? "Stable"}
                  </Badge>
                </div>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-muted-foreground hover:text-foreground p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 p-4 md:p-6">
              <div className="bg-muted/30 rounded-xl p-3 md:p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="h-3 w-3" /> Virality Score</div>
                <div className="text-xl md:text-2xl font-bold">{selectedProduct.virality_score ?? 0}%</div>
                <div className="w-full h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${selectedProduct.virality_score}%` }} />
                </div>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 md:p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><ShoppingCart className="h-3 w-3" /> TikTok Price</div>
                <div className="text-xl md:text-2xl font-bold">${selectedProduct.tiktok_price}</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 md:p-4">
                <div className="text-muted-foreground text-xs mb-1">7-Day GMV</div>
                <div className="text-xl md:text-2xl font-bold">${formatNumber(selectedProduct.gmv_7d)}</div>
                {selectedProduct.gmv_growth_pct && <div className="text-xs text-green-400 mt-1">+{selectedProduct.gmv_growth_pct}% growth</div>}
              </div>
              <div className="bg-muted/30 rounded-xl p-3 md:p-4">
                <div className="text-muted-foreground text-xs mb-1">Units Sold (7d)</div>
                <div className="text-xl md:text-2xl font-bold">{formatNumber(selectedProduct.units_sold_7d)}</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 md:p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="h-3 w-3" /> Creators Promoting</div>
                <div className="text-xl md:text-2xl font-bold">{formatNumber(selectedProduct.creator_count)}</div>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 md:p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Star className="h-3 w-3" /> Reviews</div>
                <div className="text-xl md:text-2xl font-bold">{formatNumber(selectedProduct.review_count)}</div>
                {selectedProduct.review_growth_7d > 0 && <div className="text-xs text-green-400 mt-1">+{selectedProduct.review_growth_7d} this week</div>}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 px-4 pb-4 md:px-6 md:pb-6">
              {selectedProduct.tiktok_product_url && (
                <a href={selectedProduct.tiktok_product_url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 bg-primary text-primary-foreground rounded-lg py-3 md:py-2.5 text-sm font-medium text-center hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center">
                  View on TikTok Shop
                </a>
              )}
              <button
                className="flex-1 border border-border rounded-lg py-3 md:py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors min-h-[44px]"
                onClick={() => handleFindSupplier(selectedProduct, { stopPropagation: () => {} } as any)}
              >
                Find Suppliers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
