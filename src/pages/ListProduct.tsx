import { useState, useMemo } from "react";
import { ImagePlus, X, Copy, ExternalLink, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  "Beauty & Personal Care",
  "Health & Wellness",
  "Fashion & Apparel",
  "Home & Kitchen",
  "Electronics",
  "Pet Supplies",
];

const steps = [
  "Copy full listing",
  "Open TikTok Seller Center",
  "Go to Products → Add Product",
  "Paste title, description, price",
  "Upload images",
  "Set inventory and shipping",
  "Submit for review (24–48 hrs)",
];

const ListProduct = () => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("New");
  const [description, setDescription] = useState("");
  const [sellingPoints, setSellingPoints] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Profit calculator
  const [supplierCost, setSupplierCost] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [referralFee, setReferralFee] = useState("");

  const bullets = useMemo(
    () => sellingPoints.split("\n").filter((l) => l.trim()),
    [sellingPoints]
  );

  const profitCalc = useMemo(() => {
    const sell = parseFloat(price) || 0;
    const cost = parseFloat(supplierCost) || 0;
    const ship = parseFloat(shippingCost) || 0;
    const feePct = parseFloat(referralFee) || 0;
    const fee = sell * (feePct / 100);
    const net = sell - fee - cost - ship;
    const margin = sell > 0 ? (net / sell) * 100 : 0;
    return { sell, fee, cost, ship, net, margin };
  }, [price, supplierCost, shippingCost, referralFee]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 9 - images.length;
    const toAdd = Array.from(files).slice(0, remaining);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages((prev) => [...prev.slice(0, 8), ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (idx: number) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  const copyListing = () => {
    const text = [
      title && `Title: ${title}`,
      price && `Price: $${price}`,
      comparePrice && `Compare-at Price: $${comparePrice}`,
      category && `Category: ${category}`,
      description && `\nDescription:\n${description}`,
      bullets.length > 0 && `\nKey Selling Points:\n${bullets.map((b) => `• ${b}`).join("\n")}`,
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mock stats (would come from product props)
  const stats = {
    viralityScore: 87,
    gmv7d: "$12,450",
    unitsSold: 1243,
    creatorCount: 38,
  };

  return (
    <div className="space-y-6 animate-slide-up pb-20 md:pb-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">List Product</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Prepare your TikTok Shop listing before publishing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">
          {/* Form */}
          <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-4">
            <h2 className="font-semibold text-sm md:text-base">Product Details</h2>

            {/* Title */}
            <div>
              <Label htmlFor="lp-title">Title</Label>
              <Textarea
                id="lp-title"
                maxLength={255}
                rows={2}
                placeholder="Enter product title…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 bg-background"
              />
              <p className="text-xs text-muted-foreground text-right mt-1">
                {title.length}/255
              </p>
            </div>

            {/* Price row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lp-price">Price ($)</Label>
                <Input
                  id="lp-price"
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1 bg-background min-h-[44px]"
                />
              </div>
              <div>
                <Label htmlFor="lp-compare">Compare-at Price ($)</Label>
                <Input
                  id="lp-compare"
                  type="number"
                  placeholder="Optional"
                  value={comparePrice}
                  onChange={(e) => setComparePrice(e.target.value)}
                  className="mt-1 bg-background min-h-[44px]"
                />
              </div>
            </div>

            {/* Category & Condition */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1 bg-background min-h-[44px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger className="mt-1 bg-background min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Refurbished">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="lp-desc">Description</Label>
              <Textarea
                id="lp-desc"
                rows={4}
                placeholder="Write a compelling product description…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 bg-background"
              />
            </div>

            {/* Selling Points */}
            <div>
              <Label htmlFor="lp-points">Key Selling Points</Label>
              <Textarea
                id="lp-points"
                rows={3}
                placeholder={"One point per line\nFast shipping\n100% satisfaction guarantee"}
                value={sellingPoints}
                onChange={(e) => setSellingPoints(e.target.value)}
                className="mt-1 bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">One per line — shown as bullet points in preview</p>
            </div>
          </div>

          {/* Image Upload */}
          <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-3">
            <h2 className="font-semibold text-sm md:text-base">
              Images <span className="text-muted-foreground font-normal">({images.length}/9)</span>
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {images.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              ))}
              {images.length < 9 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Stats Card */}
          <div className="rounded-xl border border-border bg-card p-4 md:p-6">
            <h2 className="font-semibold text-sm md:text-base mb-3">Product Stats</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Virality Score", value: stats.viralityScore },
                { label: "GMV 7d", value: stats.gmv7d },
                { label: "Units Sold", value: stats.unitsSold.toLocaleString() },
                { label: "Creator Count", value: stats.creatorCount },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-6">
          {/* Live Preview */}
          <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-4">
            <h2 className="font-semibold text-sm md:text-base">Listing Preview</h2>

            <div className="rounded-lg border border-border bg-background p-4 space-y-3">
              {images.length > 0 && (
                <img
                  src={images[0]}
                  alt="preview"
                  className="w-full aspect-square object-cover rounded-lg"
                />
              )}
              <p className="font-semibold text-base leading-snug">
                {title || "Product title will appear here…"}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-primary font-bold text-lg">
                  ${price || "0.00"}
                </span>
                {comparePrice && (
                  <span className="text-muted-foreground line-through text-sm">
                    ${comparePrice}
                  </span>
                )}
              </div>
              {category && <Badge variant="secondary">{category}</Badge>}
              {description && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {description}
                </p>
              )}
              {bullets.length > 0 && (
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  {bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={copyListing} className="flex-1 min-h-[44px]">
                {copied ? (
                  <>
                    <Check className="h-4 w-4" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy Full Listing
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 min-h-[44px]"
                onClick={() =>
                  window.open(
                    "https://seller-us.tiktok.com/product/sell/product/add",
                    "_blank"
                  )
                }
              >
                <ExternalLink className="h-4 w-4" /> Open Seller Center
              </Button>
            </div>
          </div>

          {/* Profit Calculator */}
          <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-4">
            <h2 className="font-semibold text-sm md:text-base">Profit Calculator</h2>
            <div className="space-y-3">
              <div>
                <Label htmlFor="lp-cost">Supplier Cost ($)</Label>
                <Input
                  id="lp-cost"
                  type="number"
                  placeholder="0.00"
                  value={supplierCost}
                  onChange={(e) => setSupplierCost(e.target.value)}
                  className="mt-1 bg-background min-h-[44px]"
                />
              </div>
              <div>
                <Label htmlFor="lp-ship">Shipping Cost ($)</Label>
                <Input
                  id="lp-ship"
                  type="number"
                  placeholder="0.00"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  className="mt-1 bg-background min-h-[44px]"
                />
              </div>
              <div>
                <Label htmlFor="lp-fee">TikTok Referral Fee (%)</Label>
                <Input
                  id="lp-fee"
                  type="number"
                  placeholder="e.g. 6 for most categories, 5 for jewelry"
                  value={referralFee}
                  onChange={(e) => setReferralFee(e.target.value)}
                  className="mt-1 bg-background min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  6% most categories, 5% select jewelry
                </p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="rounded-lg border border-border bg-background p-3 space-y-2 text-sm">
              {[
                { label: "Selling Price", value: profitCalc.sell, prefix: "$" },
                { label: "TikTok Fee", value: profitCalc.fee, prefix: "−$" },
                { label: "Supplier Cost", value: profitCalc.cost, prefix: "−$" },
                { label: "Shipping", value: profitCalc.ship, prefix: "−$" },
              ].map((r) => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span>{r.prefix}{r.value.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>Net Profit</span>
                <span className={profitCalc.net >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}>
                  ${profitCalc.net.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Margin</span>
                <span className={profitCalc.margin >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}>
                  {profitCalc.margin.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Step-by-Step Guide */}
          <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-3">
            <h2 className="font-semibold text-sm md:text-base">How to List</h2>
            <ol className="space-y-2">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListProduct;
