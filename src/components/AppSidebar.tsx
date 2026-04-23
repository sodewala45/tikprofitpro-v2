import { LayoutDashboard, Package, Calculator, Settings, Loader2, Crown, LogIn, UserPlus, PlayCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useCheckout } from "@/hooks/useCheckout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Products", url: "/products", icon: Package },
  { title: "Profit Calculator", url: "/calculator", icon: Calculator },
  { title: "Tutorials", url: "/tutorials", icon: PlayCircle },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { checkout, loading } = useCheckout();
  const { user } = useAuth();

  const { data: userPlanData } = useQuery({
    queryKey: ["user-plan-sidebar", user?.id],
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
  const isPaid = userPlanData?.plan === "pro" || userPlanData?.plan === "ultimate";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <NavLink to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center cursor-pointer hover:opacity-80 transition-opacity block">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">PS</span>
          </div>
          <img src="/tikprofitpro_logo.svg" alt="TikProfitPro" style={{ height: 28 }} className="group-data-[collapsible=icon]:hidden" />
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border space-y-2">
        {!user && (
          <>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Log In">
                  <NavLink to="/login" className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                    <LogIn className="h-4 w-4 shrink-0" />
                    <span>Log In</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Sign Up">
                  <NavLink to="/signup" className="flex items-center gap-3 px-3 py-2 rounded-md text-primary hover:bg-primary/10 transition-colors font-medium">
                    <UserPlus className="h-4 w-4 shrink-0" />
                    <span>Sign Up</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </>
        )}
        {user && !isPaid && (
          <Button
            onClick={() => checkout("pro")}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Crown className="h-4 w-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Upgrade to Pro – $39/mo</span>
              </>
            )}
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
