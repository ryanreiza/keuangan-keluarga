import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FinancialSidebar } from "@/components/FinancialSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Bell, User, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const isMobile = useIsMobile();

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

            <div className="flex items-center gap-1 md:gap-3">
              <Button variant="ghost" size="icon" className="relative h-9 w-9 md:h-10 md:w-10">
                <Bell className="h-4 w-4 md:h-5 md:w-5" />
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 md:h-3 md:w-3 bg-danger rounded-full"></span>
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
                <Settings className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
                <User className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </header>

          {/* Main Content - add bottom padding on mobile for nav */}
          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
}