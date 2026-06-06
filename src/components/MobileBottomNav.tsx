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
  { title: "Beranda", url: "/", icon: BarChart3 },
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
    <nav
      role="navigation"
      aria-label="Navigasi utama"
      className="fixed bottom-0 inset-x-0 z-50 glass-strong border-t border-border/60 md:hidden safe-area-bottom shadow-[0_-4px_20px_-8px_hsl(222_47%_11%/0.12)]"
    >
      <ul className="flex items-stretch justify-around h-16 px-0.5 gap-0.5 max-w-full overflow-hidden">
        {mainNavItems.map((item) => {
          const active = isActive(item.url);
          return (
            <li key={item.url} className="flex-1 min-w-0">
              <NavLink
                to={item.url}
                aria-label={item.title}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 w-full h-full px-1 text-[10.5px] font-semibold leading-tight transition-colors touch-target active:scale-[0.97] ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-8 rounded-b-full bg-primary" />
                )}
                <item.icon className={`h-[20px] w-[20px] shrink-0 transition-transform ${active ? "scale-110" : ""}`} />
                <span className="block w-full truncate text-center">{item.title}</span>
              </NavLink>
            </li>
          );
        })}

        <li className="flex-1 min-w-0">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Buka menu lainnya"
                className={`flex flex-col items-center justify-center gap-0.5 w-full h-full px-1 text-[10.5px] font-semibold leading-tight transition-colors touch-target active:scale-[0.97] ${
                  isMoreActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <MoreHorizontal className="h-[20px] w-[20px] shrink-0" />
                <span className="block w-full truncate text-center">Lainnya</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-2xl max-h-[85vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"
            >
              <SheetHeader className="text-left">
                <SheetTitle>Menu Lainnya</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 xs:grid-cols-3 gap-3 py-4">
                {moreNavItems.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <NavLink
                      key={item.url}
                      to={item.url}
                      onClick={() => setOpen(false)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 min-h-[88px] rounded-xl border transition-colors text-center ${
                        active
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "text-foreground border-border/60 hover:bg-accent"
                      }`}
                    >
                      <item.icon className="h-6 w-6 shrink-0" />
                      <span className="text-xs font-medium leading-tight break-words">
                        {item.title}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
