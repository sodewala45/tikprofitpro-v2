import { useState, useMemo } from "react";
import { X, Copy, ExternalLink, Check, ImagePlus, DollarSign, ListChecks, Sparkles } from "lucide-react";
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

interface ListProductModalProps {
  product: any;
  onClose: () => void;
}

const ListProductModal = ({ product, onClose }: ListProductModalProps) => {
  const matchedCategory = categories.find(
    (c) => c.toLowerCase() === (product.category ?? "").toLowerCase()
  );

  const [title, setTitle] = useState(product.product_name ?? "");
  const [price, setPrice] = useState(
    String(product.tiktok_price ?? "").replace(/[^0-9.]/g, "")
  );
  const [comparePrice, setComparePrice] = useState("");
  const [category, setCategory] = useState(matchedCategory ?? "");
  const [condition, setCondition] = useState("New");
  const [description, setDescription] = useState("");
  const [sellingPoints, setSellingPoints] = useState("");
  const [images, setImages] = useState<string[]>(product.thumbnail_url ? [product.thumbnail_url] : []);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateWithAI = async () => {
    setGenerating(true);
    try {
      const response = await fetch("https://api.tikprofitpro.shop/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: title,
          price: parseFloat(price) || 0,
          category: product.category ?? ""
        })
      });
      const parsed = await response.json();
      if (parsed.description) setDescription(parsed.description);
      if (parsed.category) setCategory(parsed.category);
      if (parsed.sellingPoints) setSellingPoints(parsed.sellingPoints);
    } catch (err) {
      console.error("AI generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

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
    Array.from(files)
      .slice(0, remaining)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result)
            setImages((prev) => [...prev.slice(0, 8), ev.target!.result as string]);
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
      bullets.length > 0 &&
        `\nKey Selling Points:\n${bullets.map((b) => `• ${b}`).join("\n")}`,
    ]
      .filter(Boolean)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="font-semibold text-base">List Product</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Prepare your TikTok Shop listing</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 md:p-6">
          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">
            {/* Product Details Section */}
            <div className="rounded-xl border border-border bg-background/50 p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Product Details</h3>
              </div>

              <div>
                <Label htmlFor="lpm-title">Title</Label>
                <Textarea
                  id="lpm-title"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lpm-price">Price ($)</Label>
                  <Input
                    id="lpm-price"
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1 bg-background min-h-[44px]"
                  />
                </div>
                <div>
                  <Label htmlFor="lpm-compare">Compare-at Price ($)</Label>
                  <Input
                    id="lpm-compare"
                    type="number"
                    placeholder="Optional"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    className="mt-1 bg-background min-h-[44px]"
                  />
                </div>
              </div>

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

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="lpm-desc">Description</Label>
                  <button
                    onClick={generateWithAI}
                    disabled={generating}
                    className="text-xs text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
                  >
                    {generating ? "⏳ Generating..." : "✨ Auto-generate with AI"}
                  </button>
                </div>
                <Textarea
                  id="lpm-desc"
                  rows={4}
                  placeholder="Write a compelling product description…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 bg-background"
                />
              </div>

              <div>
                <Label htmlFor="lpm-points">Key Selling Points</Label>
                <Textarea
                  id="lpm-points"
                  rows={3}
                  placeholder={"One point per line\nFast shipping\n100% satisfaction guarantee"}
                  value={sellingPoints}
                  onChange={(e) => setSellingPoints(e.target.value)}
                  className="mt-1 bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  One per line — shown as bullet points in preview
                </p>
              </div>
            </div>

            {/* Images */}
            <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">
                  Images{" "}
                  <span className="text-muted-foreground font-normal">
                    ({images.length}/9)
                  </span>
                </h3>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {images.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-lg overflow-hidden border border-border group"
                  >
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

            {/* Profit Calculator — moved to left column bottom */}
            <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Profit Calculator</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="lpm-cost" className="text-xs">Supplier Cost ($)</Label>
                  <Input
                    id="lpm-cost"
                    type="number"
                    placeholder="0.00"
                    value={supplierCost}
                    onChange={(e) => setSupplierCost(e.target.value)}
                    className="mt-1 bg-background min-h-[44px]"
                  />
                </div>
                <div>
                  <Label htmlFor="lpm-ship" className="text-xs">Shipping ($)</Label>
                  <Input
                    id="lpm-ship"
                    type="number"
                    placeholder="0.00"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    className="mt-1 bg-background min-h-[44px]"
                  />
                </div>
                <div>
                  <Label htmlFor="lpm-fee" className="text-xs">Referral Fee (%)</Label>
                  <Input
                    id="lpm-fee"
                    type="number"
                    placeholder="6"
                    value={referralFee}
                    onChange={(e) => setReferralFee(e.target.value)}
                    className="mt-1 bg-background min-h-[44px]"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                TikTok charges 6% for most categories, 5% for select jewelry
              </p>

              <div className="rounded-lg border border-border bg-card p-3 space-y-1.5 text-sm">
                {[
                  { label: "Selling Price", value: profitCalc.sell, prefix: "$" },
                  { label: "TikTok Fee", value: profitCalc.fee, prefix: "−$" },
                  { label: "Supplier Cost", value: profitCalc.cost, prefix: "−$" },
                  { label: "Shipping", value: profitCalc.ship, prefix: "−$" },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span>
                      {r.prefix}
                      {r.value.toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span>Net Profit</span>
                  <span className={profitCalc.net >= 0 ? "text-green-400" : "text-destructive"}>
                    ${profitCalc.net.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Margin</span>
                  <span className={profitCalc.margin >= 0 ? "text-green-400" : "text-destructive"}>
                    {profitCalc.margin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">
            {/* Live Preview */}
            <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
              <h3 className="font-semibold text-sm">Listing Preview</h3>
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                {images.length > 0 && (
                  <img
                    src={images[0]}
                    alt="preview"
                    className="w-full aspect-[4/3] object-cover rounded-lg"
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
                <div className="flex flex-wrap gap-2">
                  {category && <Badge variant="secondary">{category}</Badge>}
                  <Badge variant="outline" className="text-xs">{condition}</Badge>
                </div>
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
                    window.open("https://seller-us.tiktok.com", "_blank")
                  }
                >
                  <ExternalLink className="h-4 w-4" /> Open Seller Center
                </Button>
              </div>
            </div>

            {/* Step-by-Step Guide */}
            <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">How to List on TikTok Shop</h3>
              </div>
              <ol className="space-y-2.5">
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
    </div>
  );
};

export default ListProductModal;
