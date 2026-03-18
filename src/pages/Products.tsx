import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search, Loader2, X, TrendingUp, ShoppingCart, Users, Star,
  Factory, Lock, ChevronLeft, ChevronRight, Play, Eye,
  DollarSign, Zap, Clock, Store, Video, UserCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const phaseStyles: Record<string, string> = {
  hot:     "border-red-500/30 bg-red-500/10 text-red-400",
  rising:  "border-green-500/30 bg-green-500/10 text-green-400",
  watch:   "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  stable:  "border-gray-500/30 bg-gray-500/10 text-gray-400",
};

const platforms = [
  { id: "alibaba",    label: "Alibaba",    cost: "1 credit", color: "bg-[#E8650A] text-white hover:bg-[#C25408] border-none cursor-pointer opacity-100 rounded-lg p-3" },
  { id: "aliexpress", label: "AliExpress", cost: "1 credit", color: "bg-[#CC0000] text-white hover:bg-[#A30000] border-none cursor-pointer opacity-100 rounded-lg p-3" },
  { id: "amazon",     label: "Amazon",     cost: "1 credit", color: "bg-[#FF9900] text-black hover:bg-[#D98200] border-none cursor-pointer opacity-100 rounded-lg p-3" },
];

// Time range filter options
const TIME_FILTERS = [
  { id: "all",    label: "All Time",    days: null  },
  { id: "7d",     label: "Last 7 Days", days: 7    },
  { id: "30d",    label: "Last 30 Days",days: 30   },
  { id: "90d",    label: "Last 90 Days",days: 90   },
  { id: "6m",     label: "Last 6 Months", days: 180 },
  { id: "12m",    label: "Last 12 Months",days: 365 },
];

// Sort options
const SORT_OPTIONS = [
  { id: "virality",  label: "Virality Score" },
  { id: "newest",    label: "Newest First"   },
  { id: "gmv",       label: "GMV"            },
  { id: "views",     label: "Views"          },
  { id: "price",     label: "Price"          },
];

const formatNumber = (n: number) => {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const formatCurrency = (n: number) => {
  if (!n) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
};

// Check if product is "new" based on days
const isNewProduct = (product: any, days: number | null) => {
  if (!days) return false;
  const raw = product.created_at || product.first_seen_at || product.date_added;
  if (!raw) return false;
  // Force UTC parsing to avoid timezone mismatch
  const createdAt = new Date(raw.includes("T") ? raw : raw.replace(" ", "T") + "Z");
  const diff = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= days;
};

const Products = () => {
  const queryClient = useQueryClient();
  const [search,          setSearch]          = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage,     setCurrentPage]     = useState(1);
  const [timeFilter,      setTimeFilter]      = useState("all");
  const [sortBy,          setSortBy]          = useState("virality");
  const [activeTab,       setActiveTab]       = useState<"products"|"shops"|"creators">("products");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [supplierProduct, setSupplierProduct] = useState<any>(null);
  const [supplierPlatform,setSupplierPlatform]= useState<string | null>(null);
  const [supplierResults, setSupplierResults] = useState<any[] | null>(null);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierError,   setSupplierError]   = useState<string | null>(null);

  const ITEMS_PER_PAGE = 15;

  const { data: creditsData } = useQuery({
    queryKey: ["credits"],
    queryFn:  () => api.getCredits(),
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

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, timeFilter, sortBy]);

  const productsRaw = products as any;
  const plan        = productsRaw?.plan ?? creditsData?.plan ?? "free";
  const items       = Array.isArray(products) ? products : productsRaw?.products ?? [];
  const isFree      = plan === "free";

  // Apply time filter
  const selectedFilter = TIME_FILTERS.find(f => f.id === timeFilter);
  const selectedFilterDays: number | null = selectedFilter?.days ?? null;
  const filteredItems = selectedFilterDays !== null
  ? items.filter((p: any) => isNewProduct(p, selectedFilterDays))
  : items;

  // Apply sort
  const sortedItems = [...filteredItems].sort((a: any, b: any) => {
    if (sortBy === "virality") return (b.virality_score ?? 0) - (a.virality_score ?? 0);
    if (sortBy === "gmv")      return (b.gmv_7d ?? 0)        - (a.gmv_7d ?? 0);
    if (sortBy === "views")    return (b.video_views ?? 0)   - (a.video_views ?? 0);
    if (sortBy === "price")    return (a.tiktok_price ?? 0)  - (b.tiktok_price ?? 0);
    if (sortBy === "newest") {
      const aDate = new Date(a.created_at || a.first_seen_at || 0).getTime();
      const bDate = new Date(b.created_at || b.first_seen_at || 0).getTime();
      return bDate - aDate;
    }
    return 0;
  });

  const visibleItems  = isFree ? sortedItems.slice(0, 10) : sortedItems.slice(0, 100);
  const totalPages    = Math.ceil(visibleItems.length / ITEMS_PER_PAGE);
  const paginatedItems = visibleItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
        setSupplierResults(results.slice(0, 3));
        queryClient.invalidateQueries({ queryKey: ["user-credits-nav"] });
        queryClient.invalidateQueries({ queryKey: ["credits"] });
      }
    } catch (err: any) {
      if (err?.message?.includes("403")) setSupplierError("upgrade");
      else if (err?.message?.toLowerCase()?.includes("credit")) setSupplierError("no_credits");
      else setSupplierError(err?.message || "Failed to search suppliers");
    } finally {
      setSupplierLoading(false);
    }
  };

  // ── Mock data for New Shops & Creators (fallback) ──
  const mockNewShops = [
  {id:1, shop_name:"TrendHaven Store",   category:"Fashion",    created_at: new Date(Date.now()-12*86400000).toISOString(), gmv_total:42000,  gmv_growth_pct:340, product_count:28, followers_count:12400, shop_url:"https://tiktok.com/shop"},
  {id:2, shop_name:"GadgetPro USA",      category:"Electronics",created_at: new Date(Date.now()-28*86400000).toISOString(), gmv_total:89000,  gmv_growth_pct:210, product_count:45, followers_count:34200, shop_url:"https://tiktok.com/shop"},
  {id:3, shop_name:"BeautyBliss Shop",   category:"Beauty",     created_at: new Date(Date.now()-5*86400000).toISOString(),  gmv_total:18000,  gmv_growth_pct:520, product_count:12, follower_count:8700,  shop_url:"https://tiktok.com/shop"},
  {id:4, shop_name:"HomeEssentials USA", category:"Home",       created_at: new Date(Date.now()-45*86400000).toISOString(), gmv_total:127000, gmv_growth_pct:180, product_count:67, follower_count:52100, shop_url:"https://tiktok.com/shop"},
  {id:5, shop_name:"FitLife Gear",       category:"Fitness",    created_at: new Date(Date.now()-20*86400000).toISOString(), gmv_total:63000,  gmv_growth_pct:290, product_count:33, follower_count:21800, shop_url:"https://tiktok.com/shop"},
  {id:6, shop_name:"KidsWorld Shop",     category:"Kids",       created_at: new Date(Date.now()-8*86400000).toISOString(),  gmv_total:31000,  gmv_growth_pct:410, product_count:19, follower_count:15300, shop_url:"https://tiktok.com/shop"},
];

  const mockCreators = [
    { id:1, name:"@shopwithsarah",  type:"UGC",  followers:"234K", engagement:"8.4%", niche:"Beauty",     avg_views:"180K", aiContent:false, contact:"sarah@email.com" },
    { id:2, name:"@aigadgetreviews",type:"AIGC", followers:"89K",  engagement:"12.1%",niche:"Electronics",avg_views:"340K", aiContent:true,  contact:"contact@aigadget.com" },
    { id:3, name:"@tiktokfinds_usa",type:"UGC",  followers:"1.2M", engagement:"6.2%", niche:"General",    avg_views:"890K", aiContent:false, contact:"business@tiktokfinds.com" },
    { id:4, name:"@aiproductpro",   type:"AIGC", followers:"156K", engagement:"15.3%",niche:"General",    avg_views:"520K", aiContent:true,  contact:"info@aiproductpro.com" },
    { id:5, name:"@homewithemily",  type:"UGC",  followers:"445K", engagement:"7.8%", niche:"Home",       avg_views:"210K", aiContent:false, contact:"emily@homereviews.com" },
    { id:6, name:"@fastshopai",     type:"AIGC", followers:"312K", engagement:"11.4%",niche:"Fashion",    avg_views:"430K", aiContent:true,  contact:"info@fastshopai.com" },
  ];

  const { data: shopsData } = useQuery({
    queryKey: ["shops"],
    queryFn:  () => api.getShops(),
  });
  const shops = shopsData?.shops ?? mockNewShops;

  const { data: creatorsData } = useQuery({
    queryKey: ["creators"],
    queryFn:  () => api.getCreators(),
  });
  const creators = creatorsData?.creators ?? mockCreators;

  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">TikTok Shop Intelligence</h1>
        <p className="text-muted-foreground mt-1 text-sm">Products · New Shops · UGC & AIGC Creators</p>
      </div>

      {/* ── Main Tabs ── */}
      <div className="flex gap-2 border-b border-border pb-0">
        {[
          { id:"products", label:"📦 Products",    },
          { id:"shops",    label:"🏪 New Shops",   },
          { id:"creators", label:"🎬 Creators",    },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          TAB: PRODUCTS
      ══════════════════════════════════════ */}
      {activeTab === "products" && (
        <>
          {/* Search + Sort Row */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card border-border"
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm bg-card border border-border rounded-md px-3 py-2 text-foreground"
            >
              {SORT_OPTIONS.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Time Filter Bar */}
          <div className="flex gap-2 flex-wrap">
            {TIME_FILTERS.map(f => (
              <button key={f.id} onClick={() => setTimeFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  timeFilter === f.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/30 text-muted-foreground border-border hover:border-primary/50"
                }`}>
                {f.id === "7d"  && <span className="mr-1">🔥</span>}
                {f.id === "30d" && <span className="mr-1">⚡</span>}
                {f.label}
                {f.days && filteredItems.length > 0 && timeFilter === f.id && (
                  <span className="ml-1.5 bg-primary-foreground/20 text-primary-foreground rounded-full px-1.5">
                    {filteredItems.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:"Total Products", value:items.length,            icon:"📦", color:"text-primary"    },
              { label:"Trending Now",   value:items.filter((p:any) => p.trend_phase === "hot" || p.trend_phase === "rising").length, icon:"🔥", color:"text-red-400" },
              { label:"New This Month", value:items.filter((p:any) => isNewProduct(p, 30)).length || "—", icon:"⚡", color:"text-green-400" },
              { label:"Your Plan",      value:isFree ? "Free" : "Pro", icon:"👑", color:"text-amber-400"  },
            ].map((s,i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <span>{s.icon}</span>{s.label}
                </div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
              Failed to load products. Please try again.
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
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">GMV 7d</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Views</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ad Spend</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Video</th>
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
                        <td className="py-3 px-4 font-medium max-w-[200px]">
                          <div className="flex items-center gap-2">
                            {(isNewProduct(product, 7)) && (
                              <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">NEW🔥</span>
                            )}
                            {(isNewProduct(product, 30) && !isNewProduct(product, 7)) && (
                              <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">NEW⚡</span>
                            )}
                            <span className="truncate">{product.product_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs max-w-[100px] truncate">{product.category}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
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
                        <td className="py-3 px-4 text-green-400 font-medium text-xs">{formatCurrency(product.gmv_7d)}</td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">{formatNumber(product.video_views ?? product.view_count ?? 0)}</td>
                        <td className="py-3 px-4 text-amber-400 text-xs font-medium">{product.ad_spend ? formatCurrency(product.ad_spend) : "—"}</td>
                        <td className="py-3 px-4">
                          {product.video_url || product.tiktok_video_url ? (
                            <a href={product.video_url || product.tiktok_video_url} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1 text-xs text-primary hover:underline">
                              <Play className="h-3 w-3" /> Watch
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="outline" size="sm"
                            className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                            onClick={(e) => handleFindSupplier(product, e)}>
                            <Factory className="h-3 w-3 mr-1" />
                            Source
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {paginatedItems.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-muted-foreground">
                          {timeFilter !== "all" ? `No products found in the selected time range. Try "All Time".` : "No products found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {paginatedItems.map((product: any, i: number) => (
                  <div key={product.id ?? i}
                    className="rounded-xl border border-border bg-card p-4 space-y-3 cursor-pointer active:bg-muted/20 transition-colors"
                    onClick={() => setSelectedProduct(product)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {isNewProduct(product, 7) && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">NEW🔥</span>}
                          {isNewProduct(product, 30) && !isNewProduct(product, 7) && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">NEW⚡</span>}
                          <p className="font-medium text-sm truncate">{product.product_name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                      <Badge variant="outline" className={`shrink-0 text-[10px] ${phaseStyles[product.trend_phase] ?? phaseStyles.stable}`}>
                        {product.trend_phase ?? "Stable"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-muted-foreground mb-0.5">Virality</div>
                        <div className="font-bold text-primary">{product.virality_score ?? 0}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground mb-0.5">GMV 7d</div>
                        <div className="font-bold text-green-400">{formatCurrency(product.gmv_7d)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground mb-0.5">Price</div>
                        <div className="font-bold">${product.tiktok_price ?? 0}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm"
                        className="flex-1 text-xs border-primary/30 text-primary hover:bg-primary/10 min-h-[44px]"
                        onClick={(e) => handleFindSupplier(product, e)}>
                        <Factory className="h-3 w-3 mr-1" /> Find Supplier
                      </Button>
                      {(product.video_url || product.tiktok_video_url) && (
                        <a href={product.video_url || product.tiktok_video_url} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center justify-center gap-1 px-3 border border-border rounded-md text-xs text-muted-foreground hover:text-foreground min-h-[44px]">
                          <Play className="h-3 w-3" /> Video
                        </a>
                      )}
                    </div>
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
                    <Button variant="outline" size="sm" disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)} className="h-8 w-8 p-0">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                      <Button key={page} variant={page === currentPage ? "default" : "outline"}
                        size="sm" onClick={() => setCurrentPage(page)} className="h-8 w-8 p-0 text-xs">
                        {page}
                      </Button>
                    ))}
                    <Button variant="outline" size="sm" disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)} className="h-8 w-8 p-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════════════
          TAB: NEW SHOPS
      ══════════════════════════════════════ */}
      {activeTab === "shops" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-base">🏪 New Shops on TikTok Shop USA</h2>
              <p className="text-xs text-muted-foreground mt-1">Newly launched shops with high growth velocity</p>
            </div>
            <div className="flex gap-2">
              {["3m","6m","12m"].map(f => (
                <button key={f} onClick={() => setTimeFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    timeFilter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/30 text-muted-foreground border-border"
                  }`}>
                  Last {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shops.map(shop => (
              <div key={shop.id} className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-sm">{shop.shop_name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{shop.category}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">
                    {shop.gmv_growth_pct}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center bg-muted/30 rounded-lg p-2">
                    <div className="text-muted-foreground mb-0.5">GMV</div>
                    <div className="font-bold text-green-400">{shop.gmv_total}</div>
                  </div>
                  <div className="text-center bg-muted/30 rounded-lg p-2">
                    <div className="text-muted-foreground mb-0.5">Products</div>
                    <div className="font-bold">{shop.product_count}</div>
                  </div>
                  <div className="text-center bg-muted/30 rounded-lg p-2">
                    <div className="text-muted-foreground mb-0.5">Followers</div>
                    <div className="font-bold">{shop.followers}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Launched {shop.launched}</span>
                 {isFree ? (
  <Link to="/pricing" className="text-primary hover:underline font-medium text-xs">
    View Shop →
  </Link>
) : shop.shop_url ? (
  <a href={shop.shop_url} target="_blank" rel="noopener noreferrer"
    className="text-primary hover:underline font-medium text-xs">
    View Shop →
  </a>
) : (
  <span className="text-muted-foreground text-xs">No URL yet</span>
)}
                </div>
              </div>
            ))}
          </div>

          {isFree && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-center space-y-3">
              <div className="text-2xl">🔒</div>
              <p className="font-semibold text-sm">Upgrade to Pro to see all new shops, contact details and full analytics</p>
              <Link to="/pricing">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">Upgrade to Pro — $39/mo</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: CREATORS
      ══════════════════════════════════════ */}
      {activeTab === "creators" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-base">🎬 UGC & AIGC Creators</h2>
              <p className="text-xs text-muted-foreground mt-1">Find creators making shoppable videos for TikTok Shop USA</p>
            </div>
            <div className="flex gap-2">
              {[
                { id:"all",  label:"All Creators" },
                { id:"ugc",  label:"UGC Only"      },
                { id:"aigc", label:"AIGC Only"      },
              ].map(f => (
                <button key={f.id}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border border-border bg-muted/30 text-muted-foreground hover:border-primary/50 transition-all">
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Creator Type Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-4 w-4 text-blue-400" />
                <span className="font-semibold text-sm text-blue-400">UGC Creators</span>
              </div>
              <p className="text-xs text-muted-foreground">Real people creating authentic product review videos. Higher trust, lower conversion rates but stronger brand loyalty.</p>
            </div>
            <div className="rounded-xl border border-purple-500/25 bg-purple-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Video className="h-4 w-4 text-purple-400" />
                <span className="font-semibold text-sm text-purple-400">AIGC Creators</span>
              </div>
              <p className="text-xs text-muted-foreground">AI-generated shoppable video content. Faster production, scalable, and increasingly high converting on TikTok Shop USA.</p>
            </div>
          </div>

          {/* Creators Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creators.map(creator => (
              <div key={creator.id}
                className={`rounded-xl border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors ${
                  creator.ai_content ? "border-purple-500/25" : "border-border"
                }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-sm">{creator.name}</div>
                    <div className="text-xs text-muted-foreground">{creator.niche}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                    creator.creator_type === "AIGC"
                      ? "bg-purple-500/15 text-purple-400 border-purple-500/25"
                      : "bg-blue-500/15 text-blue-400 border-blue-500/25"
                  }`}>
                    {creator.creator_type}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center bg-muted/30 rounded-lg p-2">
                    <div className="text-muted-foreground mb-0.5">Followers</div>
                    <div className="font-bold">{creator.followers}</div>
                  </div>
                  <div className="text-center bg-muted/30 rounded-lg p-2">
                    <div className="text-muted-foreground mb-0.5">Engagement</div>
                    <div className="font-bold text-green-400">{creator.engagement_rate}</div>
                  </div>
                  <div className="text-center bg-muted/30 rounded-lg p-2">
                    <div className="text-muted-foreground mb-0.5">Avg Views</div>
                    <div className="font-bold text-primary">{creator.avg_views}</div>
                  </div>
                </div>

                {creator.aiContent && (
                  <div className="flex items-center gap-1.5 text-xs text-purple-400 bg-purple-500/10 rounded-lg px-2 py-1.5 border border-purple-500/20">
                    <Zap className="h-3 w-3" />
                    Makes AI Shoppable Videos
                  </div>
                )}

                <div className="pt-1">
                  {isFree ? (
                    <Link to="/pricing" className="block w-full">
                      <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-muted/20 text-xs text-muted-foreground hover:border-primary/30 transition-colors min-h-[44px]">
                        <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> View Contact</span>
                        <span className="text-primary">Upgrade →</span>
                      </button>
                    </Link>
                  ) : (
                    <a href={`mailto:${creator.contact_email}`}
                      className="block w-full text-center px-3 py-2 rounded-lg border border-primary/30 bg-primary/10 text-xs text-primary hover:bg-primary/20 transition-colors min-h-[44px] flex items-center justify-center">
                      Contact Creator →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isFree && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-center space-y-3">
              <div className="text-2xl">🔒</div>
              <p className="font-semibold text-sm">Upgrade to Pro to contact creators and see full analytics</p>
              <Link to="/pricing">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">Upgrade to Pro — $39/mo</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          SUPPLIER MODAL
      ══════════════════════════════════════ */}
      {supplierProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-4"
          onClick={() => setSupplierProduct(null)}>
          <div className="bg-card border border-border rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[95vh] md:max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-border sticky top-0 bg-card z-10">
              <div className="min-w-0">
                <h2 className="font-semibold text-base">Find Supplier</h2>
                <p className="text-xs text-muted-foreground mt-1 truncate">{supplierProduct.product_name}</p>
              </div>
              <button onClick={() => setSupplierProduct(null)}
                className="text-muted-foreground hover:text-foreground p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              <p className="text-sm text-muted-foreground">Choose a platform to source from:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {platforms.map(p => (
                  <Button key={p.id} variant="outline"
                    className={`flex flex-col h-auto py-3 font-semibold min-h-[44px] ${p.color} ${supplierPlatform === p.id ? "ring-2 ring-offset-1 ring-offset-background" : ""}`}
                    onClick={() => handleSearchPlatform(p.id)} disabled={supplierLoading}>
                    <span className="text-xs font-medium">{p.label}</span>
                    <span className="text-[10px] opacity-70">{isFree ? "Free preview" : p.cost}</span>
                  </Button>
                ))}
              </div>

              {supplierLoading && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Searching suppliers… 15–30 seconds</p>
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
                  <p className="text-sm text-amber-400">You've used all your credits.</p>
                  <Link to="/pricing"><Button size="sm" className="bg-primary text-primary-foreground min-h-[44px]">Upgrade →</Button></Link>
                </div>
              )}
              {supplierError && !["upgrade","no_credits"].includes(supplierError) && (
                <p className="text-center text-sm text-destructive py-4">{supplierError}</p>
              )}

              {supplierResults && supplierResults.length > 0 && (
                <div className="space-y-3 mt-2">
                  <p className="text-xs text-muted-foreground font-medium">Top {supplierResults.length} suppliers:</p>
                  {supplierResults.map((s: any, i: number) => {
                    const rc = s._profit?.rating === "green" ? "text-green-400" : s._profit?.rating === "amber" ? "text-amber-400" : "text-red-400";
                    return (
                      <div key={i} className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate max-w-[70%]">
                            {isFree ? (supplierProduct?.product_name || `Supplier ${i+1}`) : (s.supplier_name || s.name || `Supplier ${i+1}`)}
                          </span>
                          <span className={`text-xs font-semibold ${rc}`}>{s._profit?.profit_label || "—"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>Unit Cost: <span className="text-foreground font-medium">${s.unit_cost_min ?? "—"}</span></div>
                          <div>MOQ: <span className="text-foreground font-medium">{s.moq ?? "—"}</span></div>
                          <div>Shipping: <span className="text-foreground font-medium">{s.shipping_estimate_days ?? "—"} days</span></div>
                          <div>Profit: <span className="text-foreground font-medium">${s._profit?.net_profit ?? "—"}</span></div>
                        </div>
                        {s._profit?.margin_pct != null && (
                          <div className="text-xs">Margin: <span className={`font-semibold ${rc}`}>{s._profit.margin_pct}%</span></div>
                        )}
                        {isFree ? (
                          <Link to="/pricing" className="block w-full">
                            <button style={{ background:"linear-gradient(135deg,#00C853,#00BCD4)", borderRadius:"8px", padding:"10px 16px", border:"none", cursor:"pointer", width:"100%", minHeight:"44px", color:"white", fontWeight:"bold", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Upgrade to View Supplier</span>
                              <span>→</span>
                            </button>
                          </Link>
                        ) : (
                          s.supplier_url && (
                            <a href={s.supplier_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline">View Supplier →</a>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {supplierResults?.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">No suppliers found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          PRODUCT DETAIL MODAL
      ══════════════════════════════════════ */}
      {selectedProduct && !supplierProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-4"
          onClick={() => setSelectedProduct(null)}>
          <div className="bg-card border border-border rounded-t-2xl md:rounded-2xl w-full md:max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-4 md:p-6 border-b border-border sticky top-0 bg-card z-10">
              <div className="flex gap-3 md:gap-4 min-w-0">
                {selectedProduct.thumbnail_url && (
                  <img src={selectedProduct.thumbnail_url} alt={selectedProduct.product_name}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm md:text-base leading-snug truncate">{selectedProduct.product_name}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{selectedProduct.category}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className={phaseStyles[selectedProduct.trend_phase] ?? phaseStyles.stable}>
                      {selectedProduct.trend_phase ?? "Stable"}
                    </Badge>
                    {isNewProduct(selectedProduct, 7)  && <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400">New 🔥</Badge>}
                    {isNewProduct(selectedProduct, 30) && !isNewProduct(selectedProduct, 7) && <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400">New ⚡</Badge>}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedProduct(null)}
                className="text-muted-foreground hover:text-foreground p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 p-4 md:p-6">
              {[
                { label:"Virality Score", icon:<TrendingUp className="h-3 w-3"/>, value:`${selectedProduct.virality_score ?? 0}%`,  color:"text-primary",    bar:true },
                { label:"TikTok Price",   icon:<ShoppingCart className="h-3 w-3"/>, value:`$${selectedProduct.tiktok_price}`,       color:"",                bar:false },
                { label:"GMV 7 Days",     icon:<DollarSign className="h-3 w-3"/>,  value:formatCurrency(selectedProduct.gmv_7d),   color:"text-green-400",  bar:false },
                { label:"Units Sold 7d",  icon:<ShoppingCart className="h-3 w-3"/>,value:formatNumber(selectedProduct.units_sold_7d), color:"",              bar:false },
                { label:"Video Views",    icon:<Eye className="h-3 w-3"/>,         value:formatNumber(selectedProduct.video_views ?? selectedProduct.view_count ?? 0), color:"text-blue-400", bar:false },
                { label:"Ad Spend",       icon:<DollarSign className="h-3 w-3"/>,  value:selectedProduct.ad_spend ? formatCurrency(selectedProduct.ad_spend) : "—", color:"text-amber-400", bar:false },
                { label:"Creators",       icon:<Users className="h-3 w-3"/>,       value:formatNumber(selectedProduct.creator_count), color:"",              bar:false },
                { label:"Reviews",        icon:<Star className="h-3 w-3"/>,        value:formatNumber(selectedProduct.review_count),  color:"",              bar:false },
              ].map((m,i) => (
                <div key={i} className="bg-muted/30 rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">{m.icon} {m.label}</div>
                  <div className={`text-xl md:text-2xl font-bold ${m.color}`}>{m.value}</div>
                  {m.bar && (
                    <div className="w-full h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${selectedProduct.virality_score}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-3 px-4 pb-4 md:px-6 md:pb-6">
              {selectedProduct.tiktok_product_url && (
                <a href={selectedProduct.tiktok_product_url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 bg-primary text-primary-foreground rounded-lg py-3 text-sm font-medium text-center hover:opacity-90 min-h-[44px] flex items-center justify-center">
                  View on TikTok Shop
                </a>
              )}
              {(selectedProduct.video_url || selectedProduct.tiktok_video_url) && (
                <a href={selectedProduct.video_url || selectedProduct.tiktok_video_url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 border border-primary/30 text-primary rounded-lg py-3 text-sm font-medium text-center hover:bg-primary/10 min-h-[44px] flex items-center justify-center gap-2">
                  <Play className="h-4 w-4" /> Watch Video
                </a>
              )}
              <button
                className="flex-1 border border-border rounded-lg py-3 text-sm font-medium hover:bg-muted/30 min-h-[44px]"
                onClick={() => handleFindSupplier(selectedProduct, { stopPropagation: () => {} } as any)}>
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
