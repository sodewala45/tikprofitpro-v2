import { LayoutDashboard, Package, Calculator, Settings, Loader2, LogIn, UserPlus, PlayCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useCheckout } from "@/hooks/useCheckout";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";

const groups = [
  {
    label: "Research",
    items: [
      { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
      { title: "Products", url: "/products", icon: Package },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "Profit calculator", url: "/calculator", icon: Calculator },
      { title: "Tutorials", url: "/tutorials", icon: PlayCircle },
    ],
  },
  {
    label: "Account",
    items: [{ title: "Settings", url: "/settings", icon: Settings }],
  },
];

const itemCls =
  "flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[13px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors";
const activeCls = "bg-sidebar-accent text-foreground font-medium";

export function AppSidebar() {
  const { checkout, loading } = useCheckout();
  const { user } = useAuth();
  const { isPaid, label } = usePlan();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-14 px-4 flex flex-row items-center border-b border-sidebar-border">
        <NavLink to={user ? "/dashboard" : "/"} className="flex items-center group-data-[collapsible=icon]:justify-center">
          <img src="/tikprofitpro_icon.svg" alt="TikProfitPro" className="h-7 w-7 rounded-md shrink-0 hidden group-data-[collapsible=icon]:block" />
          <img src="/tikprofitpro_logo.svg" alt="TikProfitPro" style={{ height: 24 }} className="group-data-[collapsible=icon]:hidden" />
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        {groups.map((g) => (
          <SidebarGroup key={g.label} className="py-1">
            <SidebarGroupLabel className="h-7 px-2.5 text-[11px] font-medium text-muted-foreground/80">{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title} className="h-8 p-0">
                      <NavLink to={item.url} className={itemCls} activeClassName={activeCls}>
                        <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!user && (
          <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Log in" className="h-8 p-0">
                <NavLink to="/login" className={itemCls}>
                  <LogIn className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span>Log in</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Sign up" className="h-8 p-0">
                <NavLink to="/signup" className={`${itemCls} text-foreground font-medium`}>
                  <UserPlus className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span>Sign up</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        {user && !isPaid && (
          <div className="rounded-lg border border-border p-3 group-data-[collapsible=icon]:hidden">
            <div className="text-[12px] text-muted-foreground">Current plan</div>
            <div className="text-[13px] font-medium text-foreground">{label} · 10 products</div>
            <button onClick={() => checkout("pro")} disabled={loading} className="app-btn w-full mt-3">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Upgrade to Pro · $39/mo"}
            </button>
          </div>
        )}
        {user && isPaid && (
          <div className="px-2.5 text-[12px] text-muted-foreground group-data-[collapsible=icon]:hidden">
            {label} plan
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
