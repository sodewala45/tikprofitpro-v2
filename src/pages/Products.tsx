import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search, Loader2, X, Lock, ChevronLeft, ChevronRight, ChevronDown, ArrowUpRight,
  ArrowDown, ArrowUp, Package, ShoppingBag, Factory, ExternalLink,
} from "lucide-react";
import ListProductModal from "@/components/ListProductModal";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { usePlan } from "@/hooks/usePlan";
import { calcProfit, DEFAULT_CREATOR_PCT, DEFAULT_REFERRAL_PCT } from "@/lib/fees";

/* ─────────────────────────── formatting ─────────────────────────── */

const fmtNum = (n: any) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v === 0) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return Math.round(v).toLocaleString();
};

const fmtUsd = (n: any) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v === 0) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
};

const fmtPct = (n: any) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v === 0) return null;
  return `${v > 0 ? "+" : ""}${v >= 100 || v <= -100 ? Math.round(v) : v.toFixed(1)}%`;
};

const leafCategory = (c?: string) => (c ?? "").split(">").map(s => s.trim()).filter(Boolean).pop() ?? "";

const isNewProduct = (product: any, days: number | null) => {
  if (!days) return false;
  const raw = product.created_at || product.first_seen_at || product.date_added;
  if (!raw) return false;
  const createdAt = new Date(raw.includes("T") ? raw : raw.replace(" ", "T") + "Z");
  return (Date.now() - createdAt.getTime()) / 86_400_000 <= days;
};

// Data-quality guards: hide values that are clearly ingestion errors instead of showing them as facts.
const adSpendValue = (p: any): number | null => {
  const v = Number(p?.ad_spend);
  if (!Number.isFinite(v) || v <= 0) return null;
  if (Number(p?.video_views) > 0 && v === Number(p.video_views)) return null; // known ingestion bug
  return v;
};

const priceLooksWrong = (p: any): boolean => {
  const price = Number(p?.tiktok_price);
  if (!Number.isFinite(price) || price <= 0) return true;
  const gmv = Number(p?.gmv_7d), units = Number(p?.units_sold_7d);
  if (gmv > 0 && units > 0) {
    const avg = gmv / units;
    if (price > avg * 3 || price < avg / 3) return true;
  }
  return price >= 1000;
};

const Price = ({ p }: { p: any }) =>
  priceLooksWrong(p)
    ? <span className="whitespace-nowrap text-muted-foreground underline decoration-dotted underline-offset-2" title="This price doesn't match the sales data and is being reviewed">Checking</span>
    : <>${Number(p.tiktok_price).toFixed(2)}</>;

/* ─────────────────────────── small pieces ─────────────────────────── */

const STAGE: Record<string, { label: string; text: string; bg: string; dot: string }> = {
  hot:    { label: "Hot",    text: "#B42318", bg: "#FEF3F2", dot: "#F04438" },
  rising: { label: "Rising", text: "#067647", bg: "#ECFDF3", dot: "#12B76A" },
  watch:  { label: "Watch",  text: "#B54708", bg: "#FFFAEB", dot: "#F79009" },
  stable: { label: "Stable", text: "#475467", bg: "#F2F4F7", dot: "#98A2B3" },
};

const StagePill = ({ phase }: { phase?: string }) => {
  const s = STAGE[phase ?? "stable"] ?? STAGE.stable;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium whitespace-nowrap" style={{ color: s.text, background: s.bg }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
};

const Score = ({ v }: { v: any }) => {
  const n = Math.max(0, Math.min(100, Number(v) || 0));
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1 w-10 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-foreground/70" style={{ width: `${n}%` }} />
      </div>
      <span className="w-6 text-right tabular-nums">{n}</span>
    </div>
  );
};

const Delta = ({ v }: { v: any }) => {
  const t = fmtPct(v);
  if (!t) return null;
  return <div className={`text-[11px] tabular-nums ${Number(v) > 0 ? "app-up" : "app-down"}`}>{t}</div>;
};

const Thumb = ({ src, alt, size = 40 }: { src?: string; alt: string; size?: number }) => {
  const [broken, setBroken] = useState(false);
  return src && !broken ? (
    <img src={src} alt={alt} onError={() => setBroken(true)} loading="lazy"
      className="rounded-md object-cover shrink-0 border border-border bg-muted" style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-md shrink-0 border border-border bg-muted flex items-center justify-center text-muted-foreground" style={{ width: size, height: size }}>
      <Package className="h-4 w-4" strokeWidth={1.5} />
    </div>
  );
};

type SortKey = "virality" | "gmv" | "units" | "views" | "creators" | "price" | "newest";

const SortTh = ({ k, label, sort, dir, onSort, className = "" }: {
  k: SortKey; label: string; sort: SortKey; dir: "desc" | "asc"; onSort: (k: SortKey) => void; className?: string;
}) => (
  <th className={`app-th app-num cursor-pointer hover:text-foreground ${sort === k ? "text-foreground" : ""} ${className}`} onClick={() => onSort(k)}>
    <span className="inline-flex items-center gap-1">
      {label}
      {sort === k && (dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
    </span>
  </th>
);

const Drawer = ({ onClose, children, width = 560 }: { onClose: () => void; children: React.ReactNode; width?: number }) => createPortal(
  <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={onClose}>
    <div className="h-full w-full bg-card border-l border-border overflow-y-auto shadow-[0_0_0_1px_rgba(0,0,0,0.02),-12px_0_32px_-12px_rgba(0,0,0,0.12)] animate-in slide-in-from-right duration-200"
      style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>,
  document.body
);

const DrawerHeader = ({ title, sub, onClose, left }: { title: React.ReactNode; sub?: React.ReactNode; onClose: () => void; left?: React.ReactNode }) => (
  <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-4 flex items-start gap-3">
    {left}
    <div className="min-w-0 flex-1">
      <h2 className="text-[15px] font-semibold leading-snug text-foreground line-clamp-2">{title}</h2>
      {sub && <div className="mt-1 text-[12px] text-muted-foreground">{sub}</div>}
    </div>
    <button onClick={onClose} aria-label="Close" className="h-8 w-8 -mr-1 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
      <X className="h-4 w-4" />
    </button>
  </div>
);

const Stat = ({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) => (
  <div className="px-4 py-3">
    <div className="text-[12px] text-muted-foreground">{label}</div>
    <div className="mt-0.5 text-[18px] font-semibold tabular-nums text-foreground">{value}</div>
    {sub}
  </div>
);

const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="py-14 text-center text-[13px] text-muted-foreground">{children}</div>
);

const UpgradeRow = ({ text }: { text: string }) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-3">
    <div className="flex items-center gap-2 text-[13px] text-foreground">
      <Lock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} /> {text}
    </div>
    <Link to="/pricing" className="app-btn">Upgrade to Pro · $39/mo</Link>
  </div>
);

/* ─────────────────────────── config ─────────────────────────── */

const ADDED = [
  { id: "all", label: "Any time", days: null },
  { id: "7d",  label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "6m",  label: "Last 6 months", days: 180 },
  { id: "12m", label: "Last 12 months", days: 365 },
];

const STAGES = ["all", "hot", "rising", "watch", "stable"] as const;

const PLATFORMS = [
  { id: "alibaba",    label: "Alibaba",    note: "Factories, bulk" },
  { id: "aliexpress", label: "AliExpress", note: "Small orders" },
  { id: "amazon",     label: "Amazon",     note: "US retail" },
];

const ITEMS_PER_PAGE = 25;

/* ─────────────────────────── page ─────────────────────────── */

const Products = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [added, setAdded] = useState("all");
  const [stage, setStage] = useState<(typeof STAGES)[number]>("all");
  const [sort, setSort] = useState<SortKey>("virality");
  const [dir, setDir] = useState<"desc" | "asc">("desc");
  const [activeTab, setActiveTab] = useState<"products" | "shops" | "creators">("products");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [supplierProduct, setSupplierProduct] = useState<any>(null);
  const [supplierPlatform, setSupplierPlatform] = useState<string | null>(null);
  const [supplierResults, setSupplierResults] = useState<any[] | null>(null);
  const [supplierLoading, setSupplierLoading] = useState(false);
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [listProductItem, setListProductItem] = useState<any>(null);
  const [shopSearch, setShopSearch] = useState("");
  const [creatorSearch, setCreatorSearch] = useState("");
  const [creatorType, setCreatorType] = useState("all");

  const { data: creditsData } = useQuery({ queryKey: ["credits"], queryFn: () => api.getCredits(), retry: false });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["products", debouncedSearch],
    queryFn: () => (debouncedSearch ? api.searchProducts(debouncedSearch) : api.getProducts({ limit: "100" })),
  });

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, added, stage, sort, dir]);

  const creditInfo = creditsData?.credits ?? creditsData ?? {};
  const { isFree } = usePlan();
  const items: any[] = Array.isArray(products) ? products : (products as any)?.products ?? [];

  const onSort = (k: SortKey) => {
    if (k === sort) setDir(d => (d === "desc" ? "asc" : "desc"));
    else { setSort(k); setDir(k === "price" ? "asc" : "desc"); }
  };

  const rows = useMemo(() => {
    const days = ADDED.find(f => f.id === added)?.days ?? null;
    let r = days !== null ? items.filter(p => isNewProduct(p, days)) : items;
    if (stage !== "all") r = r.filter(p => (p.trend_phase ?? "stable") === stage);
    const val = (p: any): number => {
      switch (sort) {
        case "gmv": return Number(p.gmv_7d) || 0;
        case "units": return Number(p.units_sold_7d) || 0;
        case "views": return Number(p.video_views) || 0;
        case "creators": return Number(p.creator_count) || 0;
        case "price": return Number(p.tiktok_price) || 0;
        case "newest": return new Date(p.created_at || p.first_seen_at || 0).getTime();
        default: return Number(p.virality_score) || 0;
      }
    };
    return [...r].sort((a, b) => (dir === "desc" ? val(b) - val(a) : val(a) - val(b)));
  }, [items, added, stage, sort, dir]);

  const visible = isFree ? rows.slice(0, 10) : rows.slice(0, 100);
  const totalPages = Math.max(1, Math.ceil(visible.length / ITEMS_PER_PAGE));
  const pageRows = visible.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalGmv = visible.reduce((s, p) => s + (Number(p.gmv_7d) || 0), 0);
  const asOf = items[0]?.data_end_date
    ? new Date(items[0].data_end_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  /* ── supplier lookup (unchanged behaviour) ── */
  const supplierReq = useRef(0);

  const openSupplier = (product: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    supplierReq.current += 1;
    setSupplierLoading(false);
    setSupplierProduct(product);
    setSupplierPlatform(null);
    setSupplierResults(null);
    setSupplierError(null);
  };

  const searchPlatform = async (platform: string) => {
    if (!supplierProduct) return;
    const reqId = ++supplierReq.current;
    setSupplierPlatform(platform);
    setSupplierLoading(true);
    setSupplierResults(null);
    setSupplierError(null);
    try {
      let data = await api.getSuppliers(supplierProduct.id, platform);
      if (reqId !== supplierReq.current) return;
      if (data?.status === "queued" && data?.job_id) {
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 3000));
          if (reqId !== supplierReq.current) return;
          const job = await api.getSourcingJob(data.job_id);
          if (job.status === "done") { data = { success: true, suppliers: job.suppliers ?? [] }; break; }
          if (job.status === "no_match" || job.status === "failed") {
            data = { success: false, message: job.status === "no_match"
              ? "No supplier photo matched this product closely enough. Your credit was not used."
              : "The search couldn't finish this time. Your credit was not used." };
            break;
          }
        }
        if (data?.status === "queued") data = { success: false, message: "This is taking longer than usual. Reopen the product in a few minutes; it's free." };
      }
      if (data?.success === false) {
        setSupplierError(data?.message || "No matching suppliers found. Your credit was not used.");
        queryClient.invalidateQueries({ queryKey: ["credits"] });
      } else {
        const results = data?.suppliers ?? data?.results ?? (Array.isArray(data) ? data : []);
        setSupplierResults(results.slice(0, 5));
        queryClient.invalidateQueries({ queryKey: ["user-credits-nav"] });
        queryClient.invalidateQueries({ queryKey: ["credits"] });
      }
    } catch (err: any) {
      if (reqId !== supplierReq.current) return;
      let detail: any = null;
      try { detail = JSON.parse(err?.message ?? "")?.detail; } catch { /* plain text */ }
      if (detail?.code === "no_credits") setSupplierError("no_credits");
      else if (typeof detail === "string") setSupplierError(detail);
      else setSupplierError("Supplier search failed. Your credit was not used.");
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    } finally {
      if (reqId === supplierReq.current) setSupplierLoading(false);
    }
  };

  const closeSupplier = () => { supplierReq.current += 1; setSupplierLoading(false); setSupplierProduct(null); };

  /* ── shops & creators ── */
  const { data: shopsData } = useQuery({ queryKey: ["shops"], queryFn: () => api.getShops({ limit: "50", sort_by: "gmv_total" }) });
  const { data: creatorsData } = useQuery({ queryKey: ["creators"], queryFn: () => api.getCreators() });
  const shops: any[] = shopsData?.shops ?? [];
  const creators: any[] = creatorsData?.creators ?? [];

  const shopRows = shops
    .filter(s => !shopSearch || (s.shop_name ?? "").toLowerCase().includes(shopSearch.toLowerCase()))
    .sort((a, b) => (b.gmv_total ?? 0) - (a.gmv_total ?? 0));

  const creatorRows = creators
    .filter(c => (!creatorSearch || (c.username ?? "").toLowerCase().includes(creatorSearch.toLowerCase()))
      && (creatorType === "all" || (c.creator_type ?? "").toLowerCase() === creatorType))
    .sort((a, b) => (b.gmv_total ?? 0) - (a.gmv_total ?? 0));

  const tabs = [
    { id: "products", label: "Products", count: items.length },
    { id: "shops", label: "New shops", count: shops.length },
    { id: "creators", label: "Creators", count: creators.length },
  ] as const;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="app-h1">TikTok Shop research</h1>
        <p className="app-sub">
          US best-sellers, the shops behind them and the creators selling them{asOf ? ` · Sales data to ${asOf}` : ""}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`-mb-px h-10 border-b-2 text-[13px] font-medium transition-colors ${
              activeTab === t.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
            {t.count > 0 && <span className="ml-1.5 text-[12px] tabular-nums text-muted-foreground">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ══ PRODUCTS ══ */}
      {activeTab === "products" && (
        <div className="app-panel overflow-hidden">
          {/* Filter bar */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 border-b border-border p-3">
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or categories"
                className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-3 text-[13px] outline-none placeholder:text-muted-foreground focus:border-foreground/40" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="app-chip relative pr-7">
                <span className="text-muted-foreground">Added</span>
                <select value={added} onChange={e => setAdded(e.target.value)} className="appearance-none bg-transparent outline-none cursor-pointer">
                  {ADDED.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
              </label>
              <div className="inline-flex h-8 items-center rounded-md border border-border p-0.5">
                {STAGES.map(s => (
                  <button key={s} onClick={() => setStage(s)}
                    className={`h-full rounded px-2.5 text-[12px] font-medium transition-colors ${
                      stage === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                    {s === "all" ? "All stages" : STAGE[s].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:ml-auto text-[12px] text-muted-foreground tabular-nums whitespace-nowrap">
              <span className="text-foreground font-medium">{visible.length}</span> products
              {totalGmv > 0 && <> · <span className="text-foreground font-medium">{fmtUsd(totalGmv)}</span> revenue, 7 days</>}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : error ? (
            <Empty>Products didn't load. Refresh the page to try again.</Empty>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/40">
                    <tr>
                      <th className="app-th w-10 text-center">#</th>
                      <th className="app-th">Product</th>
                      <SortTh k="price" label="Price" sort={sort} dir={dir} onSort={onSort} />
                      <SortTh k="gmv" label="Revenue 7d" sort={sort} dir={dir} onSort={onSort} />
                      <SortTh k="units" label="Units 7d" sort={sort} dir={dir} onSort={onSort} />
                      <SortTh k="views" label="Video views" sort={sort} dir={dir} onSort={onSort} className="hidden xl:table-cell" />
                      <SortTh k="creators" label="Creators" sort={sort} dir={dir} onSort={onSort} className="hidden lg:table-cell" />
                      <SortTh k="virality" label="Score" sort={sort} dir={dir} onSort={onSort} />
                      <th className="app-th">Stage</th>
                      <th className="app-th w-[96px]" />
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((p, i) => (
                      <tr key={p.id ?? i} onClick={() => setSelectedProduct(p)}
                        className="group border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer">
                        <td className="app-td text-center text-muted-foreground tabular-nums">{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</td>
                        <td className="app-td max-w-[420px]">
                          <div className="flex items-center gap-3">
                            <Thumb src={p.image_storage_url || p.thumbnail_url} alt={p.product_name} />
                            <div className="min-w-0">
                              <div className="line-clamp-1 font-medium text-foreground">{p.product_name}</div>
                              <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                                <span className="truncate">{leafCategory(p.category) || "Uncategorised"}</span>
                                {isNewProduct(p, 30) && <span className="shrink-0 rounded bg-muted px-1.5 text-[11px] text-foreground">New</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="app-td app-num"><Price p={p} /></td>
                        <td className="app-td app-num font-medium text-foreground">{fmtUsd(p.gmv_7d)}<Delta v={p.gmv_growth_pct} /></td>
                        <td className="app-td app-num">{fmtNum(p.units_sold_7d)}</td>
                        <td className="app-td app-num hidden xl:table-cell">{fmtNum(p.video_views)}</td>
                        <td className="app-td app-num hidden lg:table-cell">{fmtNum(p.creator_count)}</td>
                        <td className="app-td app-num"><Score v={p.virality_score} /></td>
                        <td className="app-td"><StagePill phase={p.trend_phase} /></td>
                        <td className="app-td text-right">
                          <button onClick={e => openSupplier(p, e)} className="app-btn-ghost h-7 px-2.5 text-[12px] opacity-80 group-hover:opacity-100">
                            Suppliers
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pageRows.length === 0 && (
                  <Empty>{added !== "all" || stage !== "all" ? "No products match these filters." : "No products found."}</Empty>
                )}
              </div>

              {/* Mobile list */}
              <div className="md:hidden divide-y divide-border">
                {pageRows.map((p, i) => (
                  <button key={p.id ?? i} onClick={() => setSelectedProduct(p)} className="w-full text-left px-3 py-3 flex gap-3 active:bg-muted/40">
                    <Thumb src={p.image_storage_url || p.thumbnail_url} alt={p.product_name} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-[13px] font-medium text-foreground">{p.product_name}</div>
                      <div className="mt-1.5 flex items-center gap-3 text-[12px] tabular-nums text-muted-foreground">
                        <span className="text-foreground"><Price p={p} /></span>
                        <span>{fmtUsd(p.gmv_7d)} / 7d</span>
                        <StagePill phase={p.trend_phase} />
                      </div>
                    </div>
                  </button>
                ))}
                {pageRows.length === 0 && <Empty>No products found.</Empty>}
              </div>

              {isFree && rows.length > 10 && <UpgradeRow text={`Showing 10 of ${Math.min(rows.length, 100)} products on the Free plan.`} />}

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
                  <span className="text-[12px] text-muted-foreground tabular-nums">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, visible.length)} of {visible.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="app-btn-ghost h-7 w-7 px-0"><ChevronLeft className="h-3.5 w-3.5" /></button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                      <button key={n} onClick={() => setCurrentPage(n)}
                        className={`h-7 min-w-7 rounded-md px-2 text-[12px] tabular-nums ${n === currentPage ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}>{n}</button>
                    ))}
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="app-btn-ghost h-7 w-7 px-0"><ChevronRight className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══ SHOPS ══ */}
      {activeTab === "shops" && (
        <div className="app-panel overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-border p-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={shopSearch} onChange={e => setShopSearch(e.target.value)} placeholder="Search shops"
                className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-3 text-[13px] outline-none placeholder:text-muted-foreground focus:border-foreground/40" />
            </div>
            <p className="sm:ml-auto text-[12px] text-muted-foreground">Recently launched US shops, ranked by revenue</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="app-th w-10 text-center">#</th>
                  <th className="app-th">Shop</th>
                  <th className="app-th">Seller type</th>
                  <th className="app-th app-num">Revenue</th>
                  <th className="app-th app-num">Items sold</th>
                  <th className="app-th app-num">Avg price</th>
                  <th className="app-th app-num">Video</th>
                  <th className="app-th app-num">Live</th>
                  <th className="app-th app-num hidden lg:table-cell">Product card</th>
                  <th className="app-th app-num hidden lg:table-cell">Affiliate</th>
                </tr>
              </thead>
              <tbody>
                {shopRows.map((s, i) => (
                  <tr key={s.id ?? i} onClick={() => setSelectedShop(s)} className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer">
                    <td className="app-td text-center text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="app-td font-medium text-foreground whitespace-nowrap">{s.shop_name}</td>
                    <td className="app-td text-muted-foreground whitespace-nowrap">{s.seller_type ?? "—"}</td>
                    <td className="app-td app-num font-medium text-foreground">{fmtUsd(s.gmv_total)}<Delta v={s.gmv_growth_pct} /></td>
                    <td className="app-td app-num">{fmtNum(s.product_count ?? s.item_sold)}</td>
                    <td className="app-td app-num">{fmtUsd(s.avg_unit_price)}</td>
                    <td className="app-td app-num">{fmtUsd(s.video_revenue)}</td>
                    <td className="app-td app-num">{fmtUsd(s.live_revenue)}</td>
                    <td className="app-td app-num hidden lg:table-cell">{fmtUsd(s.product_card_revenue)}</td>
                    <td className="app-td app-num hidden lg:table-cell">{fmtUsd(s.affiliate_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shopRows.length === 0 && <Empty>No shop data yet.</Empty>}
          </div>
          {isFree && <UpgradeRow text="Pro unlocks every new shop with full revenue breakdowns." />}
        </div>
      )}

      {/* ══ CREATORS ══ */}
      {activeTab === "creators" && (
        <div className="app-panel overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-border p-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={creatorSearch} onChange={e => setCreatorSearch(e.target.value)} placeholder="Search creators"
                className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-3 text-[13px] outline-none placeholder:text-muted-foreground focus:border-foreground/40" />
            </div>
            <div className="inline-flex h-8 items-center rounded-md border border-border p-0.5">
              {[{ id: "all", l: "All" }, { id: "ugc", l: "UGC" }, { id: "aigc", l: "AI video" }].map(f => (
                <button key={f.id} onClick={() => setCreatorType(f.id)}
                  className={`h-full rounded px-2.5 text-[12px] font-medium ${creatorType === f.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>{f.l}</button>
              ))}
            </div>
            <p className="sm:ml-auto text-[12px] text-muted-foreground">Creators making shoppable videos in the US</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="app-th w-10 text-center">#</th>
                  <th className="app-th">Creator</th>
                  <th className="app-th">Type</th>
                  <th className="app-th app-num">Followers</th>
                  <th className="app-th app-num">Engagement</th>
                  <th className="app-th app-num hidden lg:table-cell">Avg views</th>
                  <th className="app-th app-num">GMV</th>
                  <th className="app-th app-num hidden xl:table-cell">Video GMV</th>
                  <th className="app-th app-num hidden xl:table-cell">Live GMV</th>
                  <th className="app-th app-num hidden lg:table-cell">Products</th>
                  <th className="app-th app-num hidden lg:table-cell">Conversion</th>
                  <th className="app-th text-right">Contact</th>
                </tr>
              </thead>
              <tbody>
                {creatorRows.map((c, i) => (
                  <tr key={c.id ?? i} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="app-td text-center text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="app-td">
                      <div className="font-medium text-foreground">{c.username}</div>
                      <div className="text-[12px] text-muted-foreground">{c.niche || "—"}</div>
                    </td>
                    <td className="app-td">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground">{c.creator_type === "AIGC" ? "AI video" : c.creator_type ?? "—"}</span>
                    </td>
                    <td className="app-td app-num">{fmtNum(c.followers)}</td>
                    <td className="app-td app-num">{Number(c.engagement_rate) ? `${c.engagement_rate}%` : "—"}</td>
                    <td className="app-td app-num hidden lg:table-cell">{fmtNum(c.avg_views)}</td>
                    <td className="app-td app-num font-medium text-foreground">{fmtUsd(c.gmv_total)}</td>
                    <td className="app-td app-num hidden xl:table-cell">{fmtUsd(c.video_gmv)}</td>
                    <td className="app-td app-num hidden xl:table-cell">{fmtUsd(c.live_gmv)}</td>
                    <td className="app-td app-num hidden lg:table-cell">{fmtNum(c.products_promoted)}</td>
                    <td className="app-td app-num hidden lg:table-cell">{Number(c.conversion_rate) ? `${c.conversion_rate}%` : "—"}</td>
                    <td className="app-td text-right whitespace-nowrap">
                      {isFree ? (
                        <Link to="/pricing" className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground"><Lock className="h-3 w-3" /> Pro</Link>
                      ) : c.contact_email && c.contact_email !== "null" ? (
                        <a href={`mailto:${c.contact_email}`} className="text-[12px] font-medium text-foreground underline underline-offset-2">Email</a>
                      ) : <span className="text-[12px] text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {creatorRows.length === 0 && <Empty>No creator data yet.</Empty>}
          </div>
          {isFree && <UpgradeRow text="Pro unlocks creator contact details." />}
        </div>
      )}

      {/* ══ PRODUCT DRAWER ══ */}
      {selectedProduct && !supplierProduct && (
        <Drawer onClose={() => setSelectedProduct(null)}>
          <DrawerHeader
            onClose={() => setSelectedProduct(null)}
            left={<Thumb src={selectedProduct.image_storage_url || selectedProduct.thumbnail_url} alt={selectedProduct.product_name} size={56} />}
            title={selectedProduct.product_name}
            sub={<div className="flex items-center gap-2"><span>{leafCategory(selectedProduct.category)}</span><StagePill phase={selectedProduct.trend_phase} /></div>}
          />
          <div className="p-5 space-y-5">
            {(selectedProduct.image_storage_url || selectedProduct.thumbnail_url) && (
              <img src={selectedProduct.image_storage_url || selectedProduct.thumbnail_url} alt={selectedProduct.product_name}
                className="w-full max-h-[320px] object-contain rounded-lg border border-border bg-muted/40"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border [&>*]:bg-card">
              <Stat label="Price" value={<Price p={selectedProduct} />} />
              <Stat label="Revenue, 7 days" value={fmtUsd(selectedProduct.gmv_7d)} sub={<Delta v={selectedProduct.gmv_growth_pct} />} />
              <Stat label="Units, 7 days" value={fmtNum(selectedProduct.units_sold_7d)} />
              <Stat label="Video views" value={fmtNum(selectedProduct.video_views)} />
              <Stat label="Creators" value={fmtNum(selectedProduct.creator_count)} />
              <Stat label="Score" value={`${selectedProduct.virality_score ?? 0}/100`} />
              <Stat label="Ad spend" value={adSpendValue(selectedProduct) != null ? fmtUsd(adSpendValue(selectedProduct)) : "—"} />
              <Stat label="Reviews" value={fmtNum(selectedProduct.review_count)} />
              <Stat label="First seen" value={selectedProduct.first_seen_at ? new Date(selectedProduct.first_seen_at).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—"} />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => openSupplier(selectedProduct)} className="app-btn h-10 flex-1"><Factory className="h-4 w-4" strokeWidth={1.75} /> Find suppliers</button>
              {selectedProduct.tiktok_product_url && (
                <a href={selectedProduct.tiktok_product_url} target="_blank" rel="noopener noreferrer" className="app-btn-ghost h-10 flex-1">
                  TikTok Shop page <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}
              <button onClick={() => { const p = selectedProduct; setSelectedProduct(null); setListProductItem(p); }} className="app-btn-ghost h-10 flex-1">
                <ShoppingBag className="h-4 w-4" strokeWidth={1.75} /> List product
              </button>
            </div>
          </div>
        </Drawer>
      )}

      {/* ══ SUPPLIER DRAWER ══ */}
      {supplierProduct && (
        <Drawer onClose={closeSupplier} width={620}>
          <DrawerHeader
            onClose={closeSupplier}
            left={<Thumb src={supplierProduct.image_storage_url || supplierProduct.thumbnail_url} alt={supplierProduct.product_name} size={44} />}
            title="Suppliers"
            sub={<span className="line-clamp-1">{supplierProduct.product_name}</span>}
          />
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex h-9 items-center rounded-md border border-border p-0.5">
                {PLATFORMS.map(pl => (
                  <button key={pl.id} disabled={supplierLoading} onClick={() => searchPlatform(pl.id)}
                    className={`h-full rounded px-3 text-[13px] font-medium transition-colors disabled:opacity-50 ${
                      supplierPlatform === pl.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                    {pl.label}
                  </button>
                ))}
              </div>
              {creditInfo?.credits_total != null && (
                <span className="text-[12px] text-muted-foreground tabular-nums">{creditInfo.credits_remaining ?? 0} of {creditInfo.credits_total} credits</span>
              )}
            </div>
            <p className="text-[12px] text-muted-foreground">
              Matched by product photo. A credit is only used when suppliers are found, and reopening a product you've already checked is free.
            </p>

            {!supplierPlatform && !supplierLoading && (
              <div className="rounded-lg border border-dashed border-border py-10 text-center text-[13px] text-muted-foreground">
                Choose a marketplace to see matching suppliers.
              </div>
            )}

            {supplierLoading && (
              <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Looking up suppliers…
              </div>
            )}

            {supplierError === "upgrade" && (
              <div className="rounded-lg border border-border p-4 flex items-center justify-between gap-3">
                <span className="text-[13px]">Supplier lookups are on paid plans.</span>
                <Link to="/pricing" className="app-btn">See plans</Link>
              </div>
            )}
            {supplierError === "no_credits" && (
              <div className="rounded-lg border border-border p-4 flex items-center justify-between gap-3">
                <span className="text-[13px]">
                  You've used all {creditInfo?.credits_total ?? ""} credits{creditInfo?.period_end ? `. They reset ${new Date(creditInfo.period_end).toLocaleDateString()}` : ""}.
                </span>
                <Link to="/pricing" className="app-btn">Upgrade</Link>
              </div>
            )}
            {supplierError && !["upgrade", "no_credits"].includes(supplierError) && (
              <div className="rounded-lg border border-border bg-muted/40 p-4 text-[13px] text-foreground">{supplierError}</div>
            )}

            {supplierResults && supplierResults.length > 0 && (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="border-b border-border bg-muted/40">
                    <tr>
                      <th className="app-th">Supplier</th>
                      <th className="app-th app-num">Unit cost</th>
                      <th className="app-th app-num">Min order</th>
                      <th className="app-th app-num">Match</th>
                      <th className="app-th app-num">Margin</th>
                      <th className="app-th" />
                    </tr>
                  </thead>
                  <tbody>
                    {supplierResults.map((s: any, i: number) => {
                      const unit = Number(s.unit_cost_min);
                      const est = Number.isFinite(unit) && unit > 0 && !priceLooksWrong(supplierProduct)
                        ? calcProfit({ sellingPrice: Number(supplierProduct.tiktok_price), productCost: unit, referralPct: DEFAULT_REFERRAL_PCT, creatorPct: DEFAULT_CREATOR_PCT })
                        : null;
                      return (
                        <tr key={i} className="border-b border-border last:border-0 align-top">
                          <td className="app-td">
                            <div className="flex items-center gap-2.5">
                              {s.image_url && <Thumb src={s.image_url} alt={s.product_title || ""} size={36} />}
                              <div className="min-w-0">
                                <div className="line-clamp-1 font-medium text-foreground">{s.supplier_name || s.name || `Supplier ${i + 1}`}</div>
                                {s.product_title && <div className="line-clamp-1 text-[12px] text-muted-foreground">{s.product_title}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="app-td app-num font-medium text-foreground">{Number.isFinite(unit) && unit > 0 ? `$${unit.toFixed(2)}` : "—"}</td>
                          <td className="app-td app-num">{s.moq ? Number(s.moq).toLocaleString() : "—"}</td>
                          <td className="app-td app-num">{s.similarity != null ? `${Math.round(Number(s.similarity) * 100)}%` : "—"}</td>
                          <td className="app-td app-num">
                            {est ? (
                              <>
                                <span className={est.margin >= 30 ? "app-up font-medium" : est.margin >= 15 ? "text-foreground" : "app-down"}>{est.margin.toFixed(0)}%</span>
                                <div className="text-[11px] text-muted-foreground">${est.profitPerUnit.toFixed(2)}/unit</div>
                              </>
                            ) : "—"}
                          </td>
                          <td className="app-td text-right">
                            {s.supplier_url && (
                              <a href={s.supplier_url} target="_blank" rel="noopener noreferrer" aria-label="Open supplier"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="border-t border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                  Margin after the 6% TikTok fee and 15% creator commission, before shipping. Order a sample before buying in bulk.
                </div>
              </div>
            )}
            {supplierResults?.length === 0 && <Empty>No suppliers found.</Empty>}
          </div>
        </Drawer>
      )}

      {/* ══ SHOP DRAWER ══ */}
      {selectedShop && (
        <Drawer onClose={() => setSelectedShop(null)} width={480}>
          <DrawerHeader onClose={() => setSelectedShop(null)} title={selectedShop.shop_name} sub={selectedShop.seller_type} />
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border [&>*]:bg-card">
              <Stat label="Revenue" value={fmtUsd(selectedShop.gmv_total)} sub={<Delta v={selectedShop.gmv_growth_pct} />} />
              <Stat label="Items sold" value={fmtNum(selectedShop.product_count ?? selectedShop.item_sold)} />
              <Stat label="Avg unit price" value={fmtUsd(selectedShop.avg_unit_price)} />
              <Stat label="Video revenue" value={fmtUsd(selectedShop.video_revenue)} />
              <Stat label="Live revenue" value={fmtUsd(selectedShop.live_revenue)} />
              <Stat label="Product card revenue" value={fmtUsd(selectedShop.product_card_revenue)} />
              <Stat label="Own account revenue" value={fmtUsd(selectedShop.self_operated_revenue)} />
              <Stat label="Affiliate revenue" value={fmtUsd(selectedShop.affiliate_revenue)} />
            </div>
            {selectedShop.shop_url && (
              <a href={selectedShop.shop_url} target="_blank" rel="noopener noreferrer" className="app-btn h-10 w-full">
                Open shop <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </Drawer>
      )}

      {listProductItem && <ListProductModal product={listProductItem} onClose={() => setListProductItem(null)} />}
    </div>
  );
};

export default Products;
