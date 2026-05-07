import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Receipt,
  PieChart,
  Building2,
  Wallet,
  Target,
  TrendingDown,
  Calendar,
  FileBarChart,
  MoreHorizontal,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Transaksi", url: "/transactions", icon: Receipt },
  { title: "Rekening", url: "/accounts", icon: Building2 },
  { title: "Tabungan", url: "/savings", icon: Target },
];

const moreNavItems = [
  { title: "Kategori", url: "/categories", icon: PieChart, description: "Kelola kategori" },
  { title: "Dashboard Rekening", url: "/account-dashboard", icon: Wallet, description: "Ringkasan per rekening" },
  { title: "Pelacak Utang", url: "/debts", icon: TrendingDown, description: "Kelola utang" },
  { title: "Tahunan", url: "/annual", icon: Calendar, description: "Analisis tahunan" },
  { title: "Laporan", url: "/reports", icon: FileBarChart, description: "Laporan budget" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const isMoreActive = moreNavItems.some((item) => isActive(item.url));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/60 md:hidden safe-area-bottom shadow-[0_-4px_20px_-8px_hsl(222_47%_11%/0.1)]">
      <div className="flex items-center justify-around h-16 px-1">
        {mainNavItems.map((item) => {
          const active = isActive(item.url);
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-semibold transition-all touch-target ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-8 rounded-b-full bg-primary" />
              )}
              <item.icon className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`} />
              <span className="truncate max-w-[64px]">{item.title}</span>
            </NavLink>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[11px] font-semibold transition-colors touch-target ${
                isMoreActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span>Lainnya</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Menu Lainnya</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 py-4">
              {moreNavItems.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  onClick={() => setOpen(false)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${
                    isActive(item.url)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs font-medium text-center leading-tight">{item.title}</span>
                </NavLink>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
