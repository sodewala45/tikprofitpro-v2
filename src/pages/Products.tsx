import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search, Loader2, X, TrendingUp, ShoppingCart, Users, Star,
  Factory, Lock, ChevronLeft, ChevronRight, Eye,
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

const TIME_FILTERS = [
  { id: "all",    label: "All Time",      days: null  },
  { id: "7d",     label: "Last 7 Days",   days: 7    },
  { id: "30d",    label: "Last 30 Days",  days: 30   },
  { id: "90d",    label: "Last 90 Days",  days: 90   },
  { id: "6m",     label: "Last 6 Months", days: 180  },
  { id: "12m",    label: "Last 12 Months",days: 365  },
];

const SORT_OPTIONS = [
  { id: "virality", label: "Virality Score" },
  { id: "newest",   label: "Newest First"   },
  { id: "gmv",      label: "GMV"            },
  { id: "views",    label: "Views"          },
  { id: "price",    label: "Price"          },
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

const isNewProduct = (product: any, days: number | null) => {
  if (!days) return false;
  const raw = product.created_at || product.first_seen_at || product.date_added;
  if (!raw) return false;
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
  const [imageModal,      setImageModal]      = useState<any>(null);
  const [shopSearch,      setShopSearch]      = useState("");
  const [shopSortBy,      setShopSortBy]      = useState("gmv_total");
  const [creatorSearch,   setCreatorSearch]   = useState("");
  const [creatorSortBy,   setCreatorSortBy]   = useState("gmv_total");
  const [creatorTypeFilter, setCreatorTypeFilter] = useState("all");

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

  const selectedFilter = TIME_FILTERS.find(f => f.id === timeFilter);
  const selectedFilterDays: number | null = selectedFilter?.days ?? null;
  const filteredItems = selectedFilterDays !== null
    ? items.filter((p: any) => isNewProduct(p, selectedFilterDays))
    : items;

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

  const visibleItems   = isFree ? sortedItems.slice(0, 10) : sortedItems.slice(0, 100);
  const totalPages     = Math.ceil(visibleItems.length / ITEMS_PER_PAGE);
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

  const mockNewShops = [
    {id:1, shop_name:"TrendHaven Store",   seller_type:"Brand", created_at: new Date(Date.now()-12*86400000).toISOString(), gmv_total:42000,  gmv_growth_pct:340, item_sold:1240, avg_unit_price:33.87, live_revenue:8200, video_revenue:18500, product_card_revenue:6300, self_operated_revenue:12000, affiliate_revenue:15000, shopping_mall_revenue:5500, shop_url:"https://tiktok.com/shop"},
    {id:2, shop_name:"GadgetPro USA",      seller_type:"Distributor", created_at: new Date(Date.now()-28*86400000).toISOString(), gmv_total:89000,  gmv_growth_pct:210, item_sold:3200, avg_unit_price:27.81, live_revenue:22000, video_revenue:31000, product_card_revenue:12000, self_operated_revenue:28000, affiliate_revenue:35000, shopping_mall_revenue:14000, shop_url:"https://tiktok.com/shop"},
    {id:3, shop_name:"BeautyBliss Shop",   seller_type:"Brand", created_at: new Date(Date.now()-5*86400000).toISOString(),  gmv_total:18000,  gmv_growth_pct:520, item_sold:680, avg_unit_price:26.47, live_revenue:4200, video_revenue:7800, product_card_revenue:2100, self_operated_revenue:6500, affiliate_revenue:8000, shopping_mall_revenue:1500, shop_url:"https://tiktok.com/shop"},
    {id:4, shop_name:"HomeEssentials USA", seller_type:"Marketplace", created_at: new Date(Date.now()-45*86400000).toISOString(), gmv_total:127000, gmv_growth_pct:180, item_sold:4800, avg_unit_price:26.46, live_revenue:32000, video_revenue:42000, product_card_revenue:18000, self_operated_revenue:38000, affiliate_revenue:52000, shopping_mall_revenue:17000, shop_url:"https://tiktok.com/shop"},
    {id:5, shop_name:"FitLife Gear",       seller_type:"Brand", created_at: new Date(Date.now()-20*86400000).toISOString(), gmv_total:63000,  gmv_growth_pct:290, item_sold:2100, avg_unit_price:30.00, live_revenue:14000, video_revenue:22000, product_card_revenue:9000, self_operated_revenue:18000, affiliate_revenue:25000, shopping_mall_revenue:10000, shop_url:"https://tiktok.com/shop"},
    {id:6, shop_name:"KidsWorld Shop",     seller_type:"Distributor", created_at: new Date(Date.now()-8*86400000).toISOString(),  gmv_total:31000,  gmv_growth_pct:410, item_sold:920, avg_unit_price:33.70, live_revenue:7200, video_revenue:11000, product_card_revenue:4800, self_operated_revenue:9500, affiliate_revenue:12500, shopping_mall_revenue:4000, shop_url:"https://tiktok.com/shop"},
  ];

  const mockCreators = [
    { id:1, username:"@shopwithsarah",   creator_type:"UGC",  followers:234000,  engagement_rate:8.4,  avg_views:180000, niche:"Beauty",      contact_email:"sarah@email.com",       ai_content:false, gmv_total:67000,  live_gmv:12000,  video_gmv:48000,  products_promoted:23,  conversion_rate:6.8  },
    { id:2, username:"@aigadgetreviews", creator_type:"AIGC", followers:89000,   engagement_rate:12.1, avg_views:340000, niche:"Electronics", contact_email:"contact@aigadget.com",  ai_content:true,  gmv_total:198000, live_gmv:0,      video_gmv:178000, products_promoted:61,  conversion_rate:8.1  },
    { id:3, username:"@tiktokfinds_usa", creator_type:"UGC",  followers:1200000, engagement_rate:6.2,  avg_views:890000, niche:"General",     contact_email:"biz@tiktokfinds.com",   ai_content:false, gmv_total:284000, live_gmv:142000, video_gmv:98000,  products_promoted:47,  conversion_rate:4.2  },
    { id:4, username:"@aiproductpro",    creator_type:"AIGC", followers:156000,  engagement_rate:15.3, avg_views:520000, niche:"General",     contact_email:"info@aiproductpro.com", ai_content:true,  gmv_total:312000, live_gmv:0,      video_gmv:287000, products_promoted:89,  conversion_rate:11.2 },
    { id:5, username:"@homewithemily",   creator_type:"UGC",  followers:445000,  engagement_rate:7.8,  avg_views:210000, niche:"Home",        contact_email:"emily@homereviews.com", ai_content:false, gmv_total:94000,  live_gmv:38000,  video_gmv:51000,  products_promoted:31,  conversion_rate:5.4  },
    { id:6, username:"@fastshopai",      creator_type:"AIGC", followers:312000,  engagement_rate:11.4, avg_views:430000, niche:"Fashion",     contact_email:"info@fastshopai.com",   ai_content:true,  gmv_total:421000, live_gmv:0,      video_gmv:398000, products_promoted:112, conversion_rate:9.7  },
  ];

  const { data: shopsData }    = useQuery({ queryKey: ["shops"],    queryFn: () => api.getShops({ limit: "50", sort_by: "gmv_total" })    });
  const { data: creatorsData } = useQuery({ queryKey: ["creators"], queryFn: () => api.getCreators() });
  const shops    = shopsData?.shops       ?? mockNewShops;
  const creators = creatorsData?.creators ?? mockCreators;

  const filteredShops = shops
    .filter((s: any) => !shopSearch || (s.shop_name ?? "").toLowerCase().includes(shopSearch.toLowerCase()))
    .sort((a: any, b: any) => {
      if (shopSortBy === "gmv_total") return (b.gmv_total ?? 0) - (a.gmv_total ?? 0);
      if (shopSortBy === "item_sold") return (b.product_count ?? b.item_sold ?? 0) - (a.product_count ?? a.item_sold ?? 0);
      if (shopSortBy === "avg_unit_price") return (b.avg_unit_price ?? 0) - (a.avg_unit_price ?? 0);
      if (shopSortBy === "name") return (a.shop_name ?? "").localeCompare(b.shop_name ?? "");
      return 0;
    });

  const filteredCreators = creators
    .filter((c: any) => {
      const matchesSearch = !creatorSearch || (c.username ?? "").toLowerCase().includes(creatorSearch.toLowerCase());
      const matchesType = creatorTypeFilter === "all" || (c.creator_type ?? "").toLowerCase() === creatorTypeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a: any, b: any) => {
      if (creatorSortBy === "gmv_total") return (b.gmv_total ?? 0) - (a.gmv_total ?? 0);
      if (creatorSortBy === "followers") return (b.followers ?? 0) - (a.followers ?? 0);
      if (creatorSortBy === "engagement") return (b.engagement_rate ?? 0) - (a.engagement_rate ?? 0);
      if (creatorSortBy === "conversion") return (b.conversion_rate ?? 0) - (a.conversion_rate ?? 0);
      return 0;
    });

  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-6">

      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">TikTok Shop Intelligence</h1>
        <p className="text-muted-foreground mt-1 text-sm">Products · New Shops · UGC & AIGC Creators</p>
      </div>

      <div className="flex gap-2 border-b border-border pb-0">
        {[
          { id:"products", label:"📦 Products"  },
          { id:"shops",    label:"🏪 New Shops"  },
          { id:"creators", label:"🎬 Creators"   },
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

      {/* ══ TAB: PRODUCTS ══ */}
      {activeTab === "products" && (
        <>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search products, categories..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="text-sm bg-card border border-border rounded-md px-3 py-2 text-foreground">
              {SORT_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

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
                  <span className="ml-1.5 bg-primary-foreground/20 text-primary-foreground rounded-full px-1.5">{filteredItems.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:"Total Products", value:items.length,            icon:"📦", color:"text-primary"    },
              { label:"Trending Now",   value:items.filter((p:any) => p.trend_phase === "hot" || p.trend_phase === "rising").length, icon:"🔥", color:"text-red-400" },
              { label:"New This Month", value:items.filter((p:any) => isNewProduct(p, 30)).length || "—", icon:"⚡", color:"text-green-400" },
              { label:"Your Plan",      value:isFree ? "Free" : "Pro", icon:"👑", color:"text-amber-400"  },
            ].map((s,i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><span>{s.icon}</span>{s.label}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">Failed to load products. Please try again.</div>
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
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Image</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((product: any, i: number) => (
                      <tr key={product.id ?? product.product_name ?? i}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => setSelectedProduct(product)}>
                        <td className="py-2 px-4 font-medium max-w-[240px]">
                          <div className="flex items-center gap-2">
                            {product.thumbnail_url ? (
                              <img src={product.thumbnail_url}
                                alt={product.product_name}
                                className="w-9 h-9 rounded-lg object-cover shrink-0 border border-border"
                                onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-muted/50 shrink-0 flex items-center justify-center text-sm border border-border">📦</div>
                            )}
                            <div className="min-w-0">
                              <div className="flex gap-1 mb-0.5">
                                {isNewProduct(product, 7) && <span className="text-[9px] font-bold px-1 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">🔥</span>}
                                {isNewProduct(product, 30) && !isNewProduct(product, 7) && <span className="text-[9px] font-bold px-1 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">⚡</span>}
                              </div>
                              <span className="truncate block text-sm">{product.product_name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-4 text-muted-foreground text-xs max-w-[100px] truncate">{product.category}</td>
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${product.virality_score ?? 0}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-7">{product.virality_score ?? 0}%</span>
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <Badge variant="outline" className={phaseStyles[product.trend_phase] ?? phaseStyles.stable}>
                            {product.trend_phase ?? "Stable"}
                          </Badge>
                        </td>
                        <td className="py-2 px-4 text-muted-foreground">${product.tiktok_price ?? 0}</td>
                        <td className="py-2 px-4 text-green-400 font-medium text-xs">{formatCurrency(product.gmv_7d)}</td>
                        <td className="py-2 px-4 text-muted-foreground text-xs">
                          {product.video_views && product.video_views > 0 ? formatNumber(product.video_views) : <span className="opacity-30">N/A</span>}
                        </td>
                        <td className="py-2 px-4 text-amber-400 text-xs font-medium">
                          {product.ad_spend && product.ad_spend > 0 ? formatCurrency(product.ad_spend) : <span className="opacity-30">N/A</span>}
                        </td>
                        <td className="py-2 px-4">
                          {product.thumbnail_url ? (
                            <button
                              onClick={e => { e.stopPropagation(); setImageModal(product); }}
                              className="flex items-center gap-1 text-xs text-primary hover:underline">
                              <Eye className="h-3 w-3" /> Image
                            </button>
                          ) : (
                            <span className="text-xs opacity-30">—</span>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <Button variant="outline" size="sm"
                            className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                            onClick={(e) => handleFindSupplier(product, e)}>
                            <Factory className="h-3 w-3 mr-1" /> Source
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {paginatedItems.length === 0 && (
                      <tr><td colSpan={10} className="py-8 text-center text-muted-foreground">
                        {timeFilter !== "all" ? `No products found in the selected time range. Try "All Time".` : "No products found"}
                      </td></tr>
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
                    <div className="flex items-start gap-3">
                      {product.thumbnail_url ? (
                        <img src={product.thumbnail_url} alt={product.product_name}
                          className="w-12 h-12 rounded-lg object-cover shrink-0 border border-border"
                          onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted/50 shrink-0 flex items-center justify-center text-xl border border-border">📦</div>
                      )}
                      <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {isNewProduct(product, 7) && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">🔥</span>}
                            {isNewProduct(product, 30) && !isNewProduct(product, 7) && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">⚡</span>}
                            <p className="font-medium text-sm truncate">{product.product_name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 text-[10px] ${phaseStyles[product.trend_phase] ?? phaseStyles.stable}`}>
                          {product.trend_phase ?? "Stable"}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center"><div className="text-muted-foreground mb-0.5">Virality</div><div className="font-bold text-primary">{product.virality_score ?? 0}%</div></div>
                      <div className="text-center"><div className="text-muted-foreground mb-0.5">GMV 7d</div><div className="font-bold text-green-400">{formatCurrency(product.gmv_7d)}</div></div>
                      <div className="text-center"><div className="text-muted-foreground mb-0.5">Price</div><div className="font-bold">${product.tiktok_price ?? 0}</div></div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm"
                        className="flex-1 text-xs border-primary/30 text-primary hover:bg-primary/10 min-h-[44px]"
                        onClick={(e) => handleFindSupplier(product, e)}>
                        <Factory className="h-3 w-3 mr-1" /> Find Supplier
                      </Button>
                      {product.thumbnail_url && (
                        <button
                          onClick={e => { e.stopPropagation(); setImageModal(product); }}
                          className="flex items-center justify-center gap-1 px-3 border border-border rounded-md text-xs text-muted-foreground hover:text-foreground min-h-[44px]">
                          <Eye className="h-3 w-3" /> Image
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {paginatedItems.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">No products found</div>}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-xs text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, visibleItems.length)} of {visibleItems.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="h-8 w-8 p-0"><ChevronLeft className="h-4 w-4" /></Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                      <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="h-8 w-8 p-0 text-xs">{page}</Button>
                    ))}
                    <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-8 w-8 p-0"><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══ TAB: NEW SHOPS ══ */}
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
                    timeFilter === f ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 text-muted-foreground border-border"
                  }`}>Last {f}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search shops..." value={shopSearch}
                onChange={(e) => setShopSearch(e.target.value)} className="pl-9 bg-card border-border" />
            </div>
            <select value={shopSortBy} onChange={e => setShopSortBy(e.target.value)}
              className="text-sm bg-card border border-border rounded-md px-3 py-2 text-foreground">
              <option value="gmv_total">Revenue</option>
              <option value="item_sold">Items Sold</option>
              <option value="avg_unit_price">Avg. Unit Price</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">Shop Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">Seller Type</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">Revenue($)</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">Item Sold</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">Avg. Unit Price($)</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">Live Revenue($)</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">Video Revenue($)</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">Product Card Revenue($)</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">Self-Operated Account Revenue($)</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">Affiliate Revenue($)</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground whitespace-nowrap">Shopping Mall Revenue($)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShops.map(shop => (
                    <tr key={shop.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-2 px-4 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{shop.shop_name}</span>
                          {shop.gmv_growth_pct > 300 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">+{shop.gmv_growth_pct}%</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap">{shop.seller_type ?? "—"}</td>
                      <td className="py-2 px-4 whitespace-nowrap text-green-400 font-semibold">{formatCurrency(shop.gmv_total)}</td>
                      <td className="py-2 px-4 whitespace-nowrap">{formatNumber(shop.product_count ?? shop.item_sold ?? 0)}</td>
                      <td className="py-2 px-4 whitespace-nowrap">${(shop.avg_unit_price ?? 0).toFixed(2)}</td>
                      <td className="py-2 px-4 whitespace-nowrap">{formatCurrency(shop.live_revenue ?? 0)}</td>
                      <td className="py-2 px-4 whitespace-nowrap">{formatCurrency(shop.video_revenue ?? 0)}</td>
                      <td className="py-2 px-4 whitespace-nowrap">{formatCurrency(shop.product_card_revenue ?? 0)}</td>
                      <td className="py-2 px-4 whitespace-nowrap">{formatCurrency(shop.self_operated_revenue ?? 0)}</td>
                      <td className="py-2 px-4 whitespace-nowrap">{formatCurrency(shop.affiliate_revenue ?? 0)}</td>
                      <td className="py-2 px-4 whitespace-nowrap">{formatCurrency(shop.shopping_mall_revenue ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {isFree && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-center space-y-3">
              <div className="text-2xl">🔒</div>
              <p className="font-semibold text-sm">Upgrade to Pro to see all new shops, contact details and full analytics</p>
              <Link to="/pricing"><Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">Upgrade to Pro — $39/mo</Button></Link>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: CREATORS ══ */}
      {activeTab === "creators" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-base">🎬 UGC & AIGC Creators</h2>
              <p className="text-xs text-muted-foreground mt-1">Find creators making shoppable videos for TikTok Shop USA</p>
            </div>
            <div className="flex gap-2">
              {[{ id:"all", label:"All Creators" },{ id:"ugc", label:"UGC Only" },{ id:"aigc", label:"AIGC Only" }].map(f => (
                <button key={f.id} className="px-3 py-1.5 rounded-full text-xs font-semibold border border-border bg-muted/30 text-muted-foreground hover:border-primary/50 transition-all">{f.label}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search creators..." value={creatorSearch}
                onChange={(e) => setCreatorSearch(e.target.value)} className="pl-9 bg-card border-border" />
            </div>
            <select value={creatorSortBy} onChange={e => setCreatorSortBy(e.target.value)}
              className="text-sm bg-card border border-border rounded-md px-3 py-2 text-foreground">
              <option value="gmv_total">Revenue</option>
              <option value="followers">Followers</option>
              <option value="engagement">Engagement Rate</option>
              <option value="conversion">Conversion Rate</option>
            </select>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-4">
              <div className="flex items-center gap-2 mb-2"><UserCheck className="h-4 w-4 text-blue-400" /><span className="font-semibold text-sm text-blue-400">UGC Creators</span></div>
              <p className="text-xs text-muted-foreground">Real people creating authentic product review videos. Higher trust, lower conversion rates but stronger brand loyalty.</p>
            </div>
            <div className="rounded-xl border border-purple-500/25 bg-purple-500/5 p-4">
              <div className="flex items-center gap-2 mb-2"><Video className="h-4 w-4 text-purple-400" /><span className="font-semibold text-sm text-purple-400">AIGC Creators</span></div>
              <p className="text-xs text-muted-foreground">AI-generated shoppable video content. Faster production, scalable, and increasingly high converting on TikTok Shop USA.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCreators.map(creator => (
              <div key={creator.id}
                className={`rounded-xl border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors ${creator.ai_content ? "border-purple-500/25" : "border-border"}`}>

                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-sm">{creator.username}</div>
                    <div className="text-xs text-muted-foreground">{creator.niche}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                    creator.creator_type === "AIGC" ? "bg-purple-500/15 text-purple-400 border-purple-500/25" : "bg-blue-500/15 text-blue-400 border-blue-500/25"
                  }`}>{creator.creator_type}</span>
                </div>

                {/* Audience row */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center bg-muted/30 rounded-lg p-2">
                    <div className="text-muted-foreground mb-0.5">Followers</div>
                    <div className="font-bold">{formatNumber(creator.followers)}</div>
                  </div>
                  <div className="text-center bg-muted/30 rounded-lg p-2">
                    <div className="text-muted-foreground mb-0.5">Engagement</div>
                    <div className="font-bold text-green-400">{creator.engagement_rate}%</div>
                  </div>
                  <div className="text-center bg-muted/30 rounded-lg p-2">
                    <div className="text-muted-foreground mb-0.5">Avg Views</div>
                    <div className="font-bold text-primary">{formatNumber(creator.avg_views)}</div>
                  </div>
                </div>

                {/* GMV divider */}
                <div className="border-t border-border pt-2">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Revenue Performance</div>

                  {/* GMV Total — hero stat */}
                  <div className="flex items-center justify-between bg-green-500/8 border border-green-500/20 rounded-lg px-3 py-2 mb-2">
                    <span className="text-xs text-muted-foreground">Total GMV</span>
                    <span className="text-sm font-bold text-green-400">{formatCurrency(creator.gmv_total ?? 0)}</span>
                  </div>

                  {/* Live GMV + Video GMV */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="bg-muted/30 rounded-lg p-2">
                      <div className="text-muted-foreground mb-0.5 flex items-center gap-1">
                        🔴 Live GMV
                      </div>
                      <div className={`font-bold ${(creator.live_gmv ?? 0) > 0 ? "text-red-400" : "text-muted-foreground opacity-40"}`}>
                        {(creator.live_gmv ?? 0) > 0 ? formatCurrency(creator.live_gmv) : "—"}
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2">
                      <div className="text-muted-foreground mb-0.5 flex items-center gap-1">
                        🎬 Video GMV
                      </div>
                      <div className="font-bold text-blue-400">{formatCurrency(creator.video_gmv ?? 0)}</div>
                    </div>
                  </div>

                  {/* Products + Conversion */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/30 rounded-lg p-2">
                      <div className="text-muted-foreground mb-0.5">Products</div>
                      <div className="font-bold text-amber-400">{creator.products_promoted ?? 0}</div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2">
                      <div className="text-muted-foreground mb-0.5">Conv. Rate</div>
                      <div className="font-bold text-primary">{creator.conversion_rate ?? 0}%</div>
                    </div>
                  </div>
                </div>

                {/* AI badge */}
                {creator.ai_content && (
                  <div className="flex items-center gap-1.5 text-xs text-purple-400 bg-purple-500/10 rounded-lg px-2 py-1.5 border border-purple-500/20">
                    <Zap className="h-3 w-3" /> Makes AI Shoppable Videos
                  </div>
                )}

                {/* CTA */}
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
              <Link to="/pricing"><Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">Upgrade to Pro — $39/mo</Button></Link>
            </div>
          )}
        </div>
      )}

      {/* ══ SUPPLIER MODAL ══ */}
      {supplierProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-4" onClick={() => setSupplierProduct(null)}>
          <div className="bg-card border border-border rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[95vh] md:max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
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
              {supplierError === "upgrade" && <div className="text-center py-4 space-y-2"><p className="text-sm text-amber-400">Supplier sourcing requires a paid plan.</p><Link to="/pricing"><Button size="sm" className="bg-primary text-primary-foreground min-h-[44px]">Upgrade →</Button></Link></div>}
              {supplierError === "no_credits" && <div className="text-center py-4 space-y-2"><p className="text-sm text-amber-400">You've used all your credits.</p><Link to="/pricing"><Button size="sm" className="bg-primary text-primary-foreground min-h-[44px]">Upgrade →</Button></Link></div>}
              {supplierError && !["upgrade","no_credits"].includes(supplierError) && <p className="text-center text-sm text-destructive py-4">{supplierError}</p>}
              {supplierResults && supplierResults.length > 0 && (
                <div className="space-y-3 mt-2">
                  <p className="text-xs text-muted-foreground font-medium">Top {supplierResults.length} suppliers:</p>
                  {supplierResults.map((s: any, i: number) => {
                    const rc = s._profit?.rating === "green" ? "text-green-400" : s._profit?.rating === "amber" ? "text-amber-400" : "text-red-400";
                    return (
                      <div key={i} className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate max-w-[70%]">{isFree ? (supplierProduct?.product_name || `Supplier ${i+1}`) : (s.supplier_name || s.name || `Supplier ${i+1}`)}</span>
                          <span className={`text-xs font-semibold ${rc}`}>{s._profit?.profit_label || "—"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>Unit Cost: <span className="text-foreground font-medium">${s.unit_cost_min ?? "—"}</span></div>
                          <div>MOQ: <span className="text-foreground font-medium">{s.moq ?? "—"}</span></div>
                          <div>Shipping: <span className="text-foreground font-medium">{s.shipping_estimate_days ?? "—"} days</span></div>
                          <div>Profit: <span className="text-foreground font-medium">${s._profit?.net_profit ?? "—"}</span></div>
                        </div>
                        {s._profit?.margin_pct != null && <div className="text-xs">Margin: <span className={`font-semibold ${rc}`}>{s._profit.margin_pct}%</span></div>}
                        {isFree ? (
                          <Link to="/pricing" className="block w-full">
                            <button style={{ background:"linear-gradient(135deg,#00C853,#00BCD4)", borderRadius:"8px", padding:"10px 16px", border:"none", cursor:"pointer", width:"100%", minHeight:"44px", color:"white", fontWeight:"bold", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Upgrade to View Supplier</span><span>→</span>
                            </button>
                          </Link>
                        ) : s.supplier_url && (
                          <a href={s.supplier_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View Supplier →</a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {supplierResults?.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No suppliers found.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ══ PRODUCT DETAIL MODAL ══ */}
      {selectedProduct && !supplierProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-card border border-border rounded-t-2xl md:rounded-2xl w-full md:max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-4 md:p-6 border-b border-border sticky top-0 bg-card z-10">
              <div className="flex gap-3 md:gap-4 min-w-0">
                {selectedProduct.thumbnail_url && (
                  <img src={selectedProduct.thumbnail_url} alt={selectedProduct.product_name}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                )}
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm md:text-base leading-snug truncate">{selectedProduct.product_name}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{selectedProduct.category}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className={phaseStyles[selectedProduct.trend_phase] ?? phaseStyles.stable}>{selectedProduct.trend_phase ?? "Stable"}</Badge>
                    {isNewProduct(selectedProduct, 7) && <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400">New 🔥</Badge>}
                    {isNewProduct(selectedProduct, 30) && !isNewProduct(selectedProduct, 7) && <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400">New ⚡</Badge>}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-muted-foreground hover:text-foreground p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4 p-4 md:p-6">
              {[
                { label:"Virality Score", icon:<TrendingUp className="h-3 w-3"/>, value:`${selectedProduct.virality_score ?? 0}%`, color:"text-primary", bar:true },
                { label:"TikTok Price",   icon:<ShoppingCart className="h-3 w-3"/>, value:`$${selectedProduct.tiktok_price}`, color:"", bar:false },
                { label:"GMV 7 Days",     icon:<DollarSign className="h-3 w-3"/>, value:formatCurrency(selectedProduct.gmv_7d), color:"text-green-400", bar:false },
                { label:"Units Sold 7d",  icon:<ShoppingCart className="h-3 w-3"/>, value:formatNumber(selectedProduct.units_sold_7d), color:"", bar:false },
                { label:"Video Views",    icon:<Eye className="h-3 w-3"/>, value:selectedProduct.video_views > 0 ? formatNumber(selectedProduct.video_views) : "N/A", color:"text-blue-400", bar:false },
                { label:"Ad Spend",       icon:<DollarSign className="h-3 w-3"/>, value:selectedProduct.ad_spend > 0 ? formatCurrency(selectedProduct.ad_spend) : "N/A", color:"text-amber-400", bar:false },
                { label:"Creators",       icon:<Users className="h-3 w-3"/>, value:formatNumber(selectedProduct.creator_count), color:"", bar:false },
                { label:"Reviews",        icon:<Star className="h-3 w-3"/>, value:formatNumber(selectedProduct.review_count), color:"", bar:false },
              ].map((m,i) => (
                <div key={i} className="bg-muted/30 rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">{m.icon} {m.label}</div>
                  <div className={`text-xl md:text-2xl font-bold ${m.color}`}>{m.value}</div>
                  {m.bar && <div className="w-full h-1.5 rounded-full bg-muted mt-2 overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${selectedProduct.virality_score}%` }} /></div>}
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
              {selectedProduct.thumbnail_url && (
                <button
                  onClick={() => setImageModal(selectedProduct)}
                  className="flex-1 border border-primary/30 text-primary rounded-lg py-3 text-sm font-medium text-center hover:bg-primary/10 min-h-[44px] flex items-center justify-center gap-2">
                  <Eye className="h-4 w-4" /> View Image
                </button>
              )}
              <button className="flex-1 border border-border rounded-lg py-3 text-sm font-medium hover:bg-muted/30 min-h-[44px]"
                onClick={() => handleFindSupplier(selectedProduct, { stopPropagation: () => {} } as any)}>
                Find Suppliers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ IMAGE MODAL ══ */}
      {imageModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setImageModal(null)}>
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <p className="text-sm font-medium truncate pr-4">{imageModal.product_name}</p>
              <button
                onClick={() => setImageModal(null)}
                className="text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <img
                src={imageModal.thumbnail_url}
                alt={imageModal.product_name}
                className="w-full rounded-xl object-contain max-h-[60vh] bg-muted/30"
                onError={(e) => {
                  (e.target as HTMLImageElement).alt = "Image not available";
                }}
              />
              {imageModal.tiktok_product_url && (
                <a
                  href={imageModal.tiktok_product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-medium text-center hover:opacity-90 min-h-[44px] flex items-center justify-center">
                  View on TikTok Shop →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Products;
