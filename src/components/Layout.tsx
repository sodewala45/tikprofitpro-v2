import { useState } from "react";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Loader2, Menu, PlayCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import VideoModal from "@/components/VideoModal";

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

  const plan = creditsData?.plan;
  const showCredits = !!creditsData;

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
          <main className="flex-1 px-4 py-5 md:px-8 md:py-7 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
      <VideoModal open={videoOpen} onOpenChange={setVideoOpen} />
    </SidebarProvider>
  );
}
