import { supabase } from "@/lib/supabase";

const BASE_URL = "https://profitscout-production.up.railway.app";

const API_KEY = "88f6c492c9fcde83687bce9d9cce0b03fdd5b84ca962de228e0dc4ad5d2bad20";
getShops:    (params?: Record<string, string>) =>
  apiFetch(`/shops?${new URLSearchParams(params)}`),
getCreators: (params?: Record<string, string>) =>
  apiFetch(`/creators?${new URLSearchParams(params)}`),
  
async function apiFetch(path: string, options?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
    ...options?.headers as Record<string, string>,
  };

  if (session?.access_token) {
    headers["Authorization"] = "Bearer " + session.access_token;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  getStats: () => apiFetch("/stats"),
  getProducts: (params?: Record<string, string>) =>
    apiFetch(`/products?${new URLSearchParams(params)}`),
  searchProducts: (query: string) =>
    apiFetch(`/search?q=${encodeURIComponent(query)}`),
  calcProfit: (data: object) =>
    apiFetch("/calculate-profit", { method: "POST", body: JSON.stringify(data) }),
  getSuppliers: (product_id: string, platform: string) =>
    apiFetch(`/products/${product_id}/suppliers/${platform}`),
  getCredits: () => apiFetch("/credits"),
  createCheckout: async (plan: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const data = await apiFetch("/create-checkout", {
      method: "POST",
      body: JSON.stringify({ email: session?.user?.email ?? '', plan }),
    });
    const checkoutUrl = data.checkout_url ?? data.url;
    if (!checkoutUrl) {
      throw new Error('No checkout URL returned. Response: ' + JSON.stringify(data));
    }
    window.location.href = checkoutUrl;
  },
};
