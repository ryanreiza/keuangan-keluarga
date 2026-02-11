import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FinancialSidebar } from "@/components/FinancialSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, User, Settings, LogOut, CreditCard, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const mockNotifications = [
  { id: 1, title: "Anggaran melebihi batas", desc: "Pengeluaran makanan sudah 120% dari anggaran", time: "5 menit lalu", unread: true },
  { id: 2, title: "Pembayaran utang jatuh tempo", desc: "Cicilan kartu kredit jatuh tempo besok", time: "1 jam lalu", unread: true },
  { id: 3, title: "Tabungan tercapai!", desc: "Target dana darurat sudah tercapai 100%", time: "2 jam lalu", unread: false },
  { id: 4, title: "Transaksi baru dicatat", desc: "Pemasukan Rp 5.000.000 berhasil dicatat", time: "Kemarin", unread: false },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const unreadCount = mockNotifications.filter(n => n.unread).length;
  const userInitials = (user?.user_metadata?.full_name || user?.email || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-surface">
        {/* Sidebar - hidden on mobile */}
        {!isMobile && <FinancialSidebar />}

        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-14 md:h-16 bg-background border-b border-border flex items-center justify-between px-4 md:px-6 shadow-sm">
            <div className="flex items-center gap-3 md:gap-4">
              {!isMobile && (
                <SidebarTrigger className="p-2 hover:bg-accent rounded-lg transition-colors" />
              )}
              <div className="text-xs md:text-sm text-muted-foreground">
                {new Date().toLocaleDateString("id-ID", isMobile ? { 
                  month: "short", 
                  day: "numeric",
                  year: "numeric"
                } : { 
                  weekday: "long", 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              {/* Notification Dropdown */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 md:h-10 md:w-10">
                    <Bell className="h-4 w-4 md:h-5 md:w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 text-[10px] font-bold flex items-center justify-center bg-danger text-white rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 bg-background border border-border z-50">
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-foreground">Notifikasi</h4>
                    <span className="text-xs text-muted-foreground">{unreadCount} belum dibaca</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {mockNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${n.unread ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex items-start gap-2">
                          {n.unread && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                          <div className={n.unread ? "" : "ml-4"}>
                            <p className="text-sm font-medium text-foreground">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                            <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-border">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-primary">
                      Lihat semua notifikasi
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Settings Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 md:h-10 md:w-10"
                onClick={() => navigate("/settings")}
              >
                <Settings className="h-4 w-4 md:h-5 md:w-5" />
              </Button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded-full">
                    <Avatar className="h-7 w-7 md:h-8 md:w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background border border-border z-50">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {user?.user_metadata?.full_name || "Pengguna"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Edit Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/accounts")} className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Rekening Saya
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Pengaturan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-danger focus:text-danger">
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content - add bottom padding on mobile for nav */}
          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            <AnimatePresence mode="wait">
              <PageTransition>{children}</PageTransition>
            </AnimatePresence>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
}