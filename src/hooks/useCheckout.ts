import { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useCheckout() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkout = async (plan: string = "pro") => {
    setLoading(true);
    try {
      await api.createCheckout(plan);
    } catch (err: any) {
      toast({
        title: "Checkout failed",
        description: err?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { checkout, loading };
}
