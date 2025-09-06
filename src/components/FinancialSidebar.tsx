import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  CreditCard,
  DollarSign,
  PieChart,
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  BarChart3,
  Receipt,
  Building2,
  ChevronLeft,
  Menu,
  LogOut,
  User
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard Bulanan",
    url: "/",
    icon: BarChart3,
    description: "Ringkasan keuangan bulan ini"
  },
  {
    title: "Transaksi",
    url: "/transactions",
    icon: Receipt,
    description: "Catat pemasukan dan pengeluaran"
  },
  {
    title: "Kategori",
    url: "/categories",
    icon: PieChart,
    description: "Kelola kategori keuangan"
  },
  {
    title: "Rekening Bank",
    url: "/accounts",
    icon: Building2,
    description: "Daftar rekening dan saldo"
  },
  {
    title: "Dashboard Rekening",
    url: "/account-dashboard",
    icon: Wallet,
    description: "Ringkasan per rekening"
  },
  {
    title: "Pelacak Tabungan",
    url: "/savings",
    icon: Target,
    description: "Target dan progres tabungan"
  },
  {
    title: "Pelacak Utang",
    url: "/debts",
    icon: TrendingDown,
    description: "Kelola utang dan piutang"
  },
  {
    title: "Dashboard Tahunan",
    url: "/annual",
    icon: Calendar,
    description: "Analisis keuangan tahunan"
  }
];

export function FinancialSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  const getNavClasses = (path: string) => {
    const baseClasses = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group";
    if (isActive(path)) {
      return `${baseClasses} bg-sidebar-accent text-sidebar-accent-foreground shadow-sm`;
    }
    return `${baseClasses} text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50`;
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Logout gagal",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout berhasil",
        description: "Sampai jumpa lagi!",
      });
      navigate('/auth');
    }
  };

  return (
    <Sidebar
      className="border-r border-sidebar-border transition-all duration-300"
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar">
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <DollarSign className="h-6 w-6 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">
                  Keuangan Keluarga
                </h1>
                <p className="text-xs text-sidebar-foreground/60">
                  Kelola Keuangan Pribadi
                </p>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-accent rounded-full">
                <User className="h-4 w-4 text-accent-foreground" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {user.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <SidebarGroup className="px-4 py-6">
          <SidebarGroupLabel className={`text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-4 ${isCollapsed ? "sr-only" : ""}`}>
            Menu Utama
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="p-0">
                    <NavLink to={item.url} className={getNavClasses(item.url)}>
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-xs text-sidebar-foreground/50 truncate">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className="mt-auto">
          {/* Total Balance */}
          {!isCollapsed && (
            <div className="p-4 border-t border-sidebar-border">
              <div className="bg-gradient-primary rounded-lg p-4 text-center">
                <div className="text-primary-foreground font-medium text-sm mb-1">
                  Total Saldo
                </div>
                <div className="text-2xl font-bold text-primary-foreground">
                  Rp 25.750.000
                </div>
              </div>
            </div>
          )}
          
          {/* Logout Button */}
          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}