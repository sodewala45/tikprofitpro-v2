import { Settings as SettingsIcon, LogOut, Crown, CreditCard, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const SettingsPage = () => {
  const { user, signOut } = useAuth();

  const { data: userData } = useQuery({
    queryKey: ["user-settings", user?.id],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data } = await supabase
        .from("users")
        .select("plan")
        .eq("user_email", user.email)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.email,
  });

  const plan = userData?.plan ?? "free";
  const isPaid = plan === "pro" || plan === "ultimate";

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-up pb-20 md:pb-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account and preferences</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <User className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-base md:text-lg">Account</h2>
        </div>
        <div className="text-sm text-muted-foreground">Email</div>
        <div className="text-sm font-medium break-all">{user?.email ?? "—"}</div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-base md:text-lg">Plan</h2>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {plan === "free" ? (
            <>
              <span className="text-sm font-medium">Free Plan</span>
              <Link to="/pricing" className="text-xs text-primary hover:underline font-medium">Upgrade →</Link>
            </>
          ) : (
            <span className="text-sm font-medium">
              {plan === "pro" ? "Pro Plan ✅" : "Ultimate Plan ✅"}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 md:p-6 space-y-3">
        <h2 className="font-semibold text-base md:text-lg text-destructive">Account Actions</h2>
        <Button variant="destructive" size="sm" onClick={signOut} className="gap-1.5 w-full sm:w-auto min-h-[44px]">
          <LogOut className="h-4 w-4" />
          Log Out
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
