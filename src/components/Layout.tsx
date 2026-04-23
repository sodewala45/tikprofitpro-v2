import { useState } from "react";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, Menu, PlayCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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

  const { data: creditsData } = useQuery({
    queryKey: ["user-credits-nav", user?.id],
    queryFn: async () => {
      if (!user?.email) return null;
      const { data } = await supabase
        .from("user_credits")
        .select("credits_used, credits_total, plan")
        .eq("user_email", user.email)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.email,
  });

  const plan = creditsData?.plan;
  const showCredits = !!creditsData;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 md:h-14 flex items-center justify-between border-b border-border px-3 md:px-4 shrink-0">
            <div className="flex items-center">
              <MobileMenuButton />
              <SidebarTrigger className="hidden md:flex text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] items-center justify-center" />
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVideoOpen(true)}
                className="text-muted-foreground hover:text-foreground gap-1.5 min-h-[44px]"
              >
                <PlayCircle className="h-4 w-4" />
                <span className="hidden sm:inline">How to Use</span>
              </Button>
              {showCredits && (
                <span className="text-[10px] md:text-xs text-muted-foreground bg-muted/50 px-2 md:px-2.5 py-1 rounded-md">
                  <span className="text-foreground font-medium">{creditsData?.credits_used ?? 0}/{creditsData?.credits_total ?? 0}</span>
                </span>
              )}
              {user?.email && (
                <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline truncate max-w-[120px] md:max-w-none">
                  {user.email}
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground gap-1.5 min-h-[44px]">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log Out</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      <VideoModal open={videoOpen} onOpenChange={setVideoOpen} />
    </SidebarProvider>
  );
}
