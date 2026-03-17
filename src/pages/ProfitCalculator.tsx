import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import { Calculator, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

interface ProfitResult {
  revenue?: number;
  total_cost?: number;
  profit?: number;
  margin?: number;
  [key: string]: any;
}

const ProfitCalculator = () => {
  const [form, setForm] = useState({
    product_cost: "",
    shipping_cost: "",
    selling_price: "",
    quantity: "1",
  });
  const [result, setResult] = useState<ProfitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const calculate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const payload = {
        product_id: "manual",
        sale_price: parseFloat(form.selling_price) || 0,
        cogs: parseFloat(form.product_cost) || 0,
      };
      const data = await api.calcProfit(payload);
      setResult({
        revenue: data.summary?.sale_price,
        total_cost: data.summary?.total_costs,
        profit: data.summary?.net_profit,
        margin: data.summary?.margin_pct,
        rating: data.rating,
        warnings: data.warnings,
        breakdown: data.breakdown,
      });
    } catch (err: any) {
      setError(err?.message || "Calculation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Navbar />
    <div className="space-y-6 animate-slide-up pb-20 md:pb-6 pt-24 md:pt-24 px-4 md:px-0">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Profit Calculator</h1>
        <p className="text-muted-foreground mt-1 text-sm">Calculate margins and estimate profits</p>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
        {/* Input Form */}
        <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-sm md:text-base">Input Details</h2>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="product_cost">Product Cost ($)</Label>
              <Input id="product_cost" type="number" placeholder="0.00" value={form.product_cost} onChange={(e) => update("product_cost", e.target.value)} className="mt-1 bg-background min-h-[44px]" />
            </div>
            <div>
              <Label htmlFor="shipping_cost">Shipping Cost ($)</Label>
              <Input id="shipping_cost" type="number" placeholder="0.00" value={form.shipping_cost} onChange={(e) => update("shipping_cost", e.target.value)} className="mt-1 bg-background min-h-[44px]" />
            </div>
            <div>
              <Label htmlFor="selling_price">Selling Price ($)</Label>
              <Input id="selling_price" type="number" placeholder="0.00" value={form.selling_price} onChange={(e) => update("selling_price", e.target.value)} className="mt-1 bg-background min-h-[44px]" />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" placeholder="1" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} className="mt-1 bg-background min-h-[44px]" />
            </div>
          </div>

          <Button onClick={calculate} disabled={loading} className="w-full mt-2 min-h-[44px]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Calculate Profit"}
          </Button>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="rounded-xl border border-border bg-card p-4 md:p-6">
          <h2 className="font-semibold mb-4 text-sm md:text-base">Results</h2>
          {result ? (
            <div className="space-y-4">
              {[
                { label: "Revenue", value: result.revenue, prefix: "$" },
                { label: "Total Cost", value: result.total_cost, prefix: "$" },
                { label: "Profit", value: result.profit, prefix: "$", highlight: true },
                { label: "Margin", value: result.margin, suffix: "%" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`text-base md:text-lg font-semibold ${item.highlight ? (Number(item.value) >= 0 ? "text-success" : "text-destructive") : ""}`}>
                    {item.value != null
                      ? `${item.prefix ?? ""}${Number(item.value).toFixed(2)}${item.suffix ?? ""}`
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center text-muted-foreground">
              <Calculator className="h-8 w-8 md:h-10 md:w-10 mb-3 opacity-40" />
              <p className="text-sm">Enter your product details and click Calculate to see results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default ProfitCalculator;
