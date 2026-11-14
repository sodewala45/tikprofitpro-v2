import { useState } from "react";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Loader2, Menu, PlayCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import VideoModal from "@/components/VideoModal";
import { loginReturnUrl } from "@/lib/authFlow";
import { useCheckoutReturn } from "@/hooks/useCheckoutReturn";
import { usePlan } from "@/hooks/usePlan";

function MobileMenuButton() {
  const { toggleSidebar, isMobile } = useSidebar();
  if (!isMobile) return null;
  return (
    <button
      onClick={toggleSidebar}
      className="md:hidden text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const [videoOpen, setVideoOpen] = useState(false);

  // Backend is the single source of truth (it also rolls over the monthly period).
  const { data: creditsResp } = useQuery({
    queryKey: ["credits"],
    queryFn: () => api.getCredits(),
    enabled: !!user?.email,
    retry: false,
  });
  const creditsData = creditsResp?.credits ?? null;

  const showCredits = !!creditsData;
  // /credits reports email_confirmed:false for accounts that haven't clicked the confirmation link yet.
  const needsConfirm = !!user && creditsResp?.email_confirmed === false;
  const [resend, setResend] = useState<"idle" | "sending" | "sent">("idle");
  const checkoutState = useCheckoutReturn();
  const { label: planLabel } = usePlan();
  const resendConfirm = async () => {
    if (!user?.email) return;
    setResend("sending");
    await supabase.auth.resend({ type: "signup", email: user.email, options: { emailRedirectTo: loginReturnUrl(null) } });
    setResend("sent"); // same message whatever happened
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border bg-card px-3 md:px-5 shrink-0">
            <div className="flex items-center">
              <MobileMenuButton />
              <SidebarTrigger className="hidden md:flex text-muted-foreground hover:text-foreground h-8 w-8 items-center justify-center" />
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              {showCredits && (
                <span className="hidden sm:inline text-[12px] text-muted-foreground tabular-nums px-2">
                  <span className="text-foreground font-medium">{creditsData?.credits_remaining ?? 0}</span> / {creditsData?.credits_total ?? 0} credits
                </span>
              )}
              <button onClick={() => setVideoOpen(true)} className="app-btn-ghost">
                <PlayCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">How to use</span>
              </button>
              {user?.email && (
                <span className="hidden lg:inline text-[12px] text-muted-foreground truncate max-w-[200px] px-2 border-l border-border ml-1">
                  {user.email}
                </span>
              )}
              <button onClick={signOut} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted">
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </header>
          {needsConfirm && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 border-b border-amber-200 bg-amber-50 px-4 md:px-8 py-2 text-[13px] text-amber-900" role="status">
              <span>Confirm your email to use your free sourcing credits. Open the link we sent to <span className="font-medium break-all">{user?.email}</span>.</span>
              {resend === "sent" ? (
                <span className="text-amber-800">A new link is on its way.</span>
              ) : (
                <button onClick={resendConfirm} disabled={resend === "sending"} className="font-medium underline underline-offset-2 disabled:opacity-60 sm:ml-auto">
                  {resend === "sending" ? "Sending…" : "Resend link"}
                </button>
              )}
            </div>
          )}
          {user && checkoutState === "waiting" && (
            <div className="flex items-center gap-2 border-b border-border bg-muted px-4 md:px-8 py-2 text-[13px]" role="status">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Confirming your payment with Lemon Squeezy… your plan updates here in a few seconds.</span>
            </div>
          )}
          {user && checkoutState === "done" && (
            <div className="border-b border-emerald-200 bg-emerald-50 px-4 md:px-8 py-2 text-[13px] text-emerald-800" role="status">
              You're on {planLabel}. The full product list and your new credits are unlocked.
            </div>
          )}
          {user && checkoutState === "timeout" && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 md:px-8 py-2 text-[13px] text-amber-900" role="status">
              Your payment is still being confirmed. Refresh this page in a minute; if it still says Free, contact support with the email you paid with.
            </div>
          )}
          <main className="flex-1 px-4 py-5 md:px-8 md:py-7 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
      <VideoModal open={videoOpen} onOpenChange={setVideoOpen} />
    </SidebarProvider>
  );
}
