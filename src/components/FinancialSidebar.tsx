import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAccounts } from "@/hooks/useAccounts";
import {
  PieChart,
  Wallet,
  TrendingDown,
  Target,
  Calendar,
  BarChart3,
  Receipt,
  Building2,
  LogOut,
  FileBarChart,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const overviewItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Dashboard Tahunan", url: "/annual", icon: Calendar },
  { title: "Laporan Budget", url: "/reports", icon: FileBarChart },
];

const managementItems = [
  { title: "Transaksi", url: "/transactions", icon: Receipt },
  { title: "Kategori", url: "/categories", icon: PieChart },
  { title: "Rekening Bank", url: "/accounts", icon: Building2 },
  { title: "Dashboard Rekening", url: "/account-dashboard", icon: Wallet },
  { title: "Pelacak Tabungan", url: "/savings", icon: Target },
  { title: "Pelacak Utang", url: "/debts", icon: TrendingDown },
];

export function FinancialSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { accounts } = useAccounts();
  const isCollapsed = state === "collapsed";
  const [showBalance, setShowBalance] = useState(true);

  const totalBalance = accounts.reduce((sum, account) => sum + account.current_balance, 0);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const navClass = (path: string) => {
    const base =
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative";
    if (isActive(path)) {
      return `${base} bg-sidebar-accent text-sidebar-accent-foreground shadow-sm before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1 before:rounded-r-full before:bg-sidebar-primary`;
    }
    return `${base} text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60`;
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({ title: "Logout gagal", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Logout berhasil", description: "Sampai jumpa lagi!" });
      navigate("/auth");
    }
  };

  const userInitials = (user?.user_metadata?.full_name || user?.email || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar
      className="border-r border-sidebar-border transition-all duration-300"
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar">
        {/* Brand */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-xl shadow-glow shrink-0">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="text-base font-bold font-display text-sidebar-foreground leading-tight">
                  Keuangan Keluarga
                </h1>
                <p className="text-[11px] text-sidebar-foreground/50 mt-0.5">Personal Finance Suite</p>
              </div>
            )}
          </div>
        </div>

        {/* User */}
        {user && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.user_metadata?.full_name || "Pengguna"}
                  </p>
                  <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overview */}
        <SidebarGroup className="px-3 pt-4">
          <SidebarGroupLabel
            className={`text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-2 mb-2 ${
              isCollapsed ? "sr-only" : ""
            }`}
          >
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {overviewItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="p-0">
                    <NavLink to={item.url} className={navClass(item.url)}>
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management */}
        <SidebarGroup className="px-3 pt-4">
          <SidebarGroupLabel
            className={`text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-2 mb-2 ${
              isCollapsed ? "sr-only" : ""
            }`}
          >
            Manajemen
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="p-0">
                    <NavLink to={item.url} className={navClass(item.url)}>
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className="mt-auto">
          {!isCollapsed && (
            <div className="p-4">
              <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-primary shadow-elegant">
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-white/5" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] uppercase tracking-wider text-primary-foreground/70 font-semibold">
                      Total Saldo
                    </span>
                    <button
                      onClick={() => setShowBalance((s) => !s)}
                      className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                      aria-label="Toggle saldo"
                    >
                      {showBalance ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <div className="text-xl font-bold font-mono-num text-primary-foreground tracking-tight">
                    {showBalance ? `Rp ${totalBalance.toLocaleString("id-ID")}` : "Rp ••••••"}
                  </div>
                  <p className="text-[11px] text-primary-foreground/60 mt-1">
                    Saldo gabungan {accounts.length} rekening
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 border-t border-sidebar-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
