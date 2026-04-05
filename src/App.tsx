import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Categories = lazy(() => import("./pages/Categories"));
const Accounts = lazy(() => import("./pages/Accounts"));
const AccountDashboard = lazy(() => import("./pages/AccountDashboard"));
const Savings = lazy(() => import("./pages/Savings"));
const Debts = lazy(() => import("./pages/Debts"));
const Annual = lazy(() => import("./pages/Annual"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const ProtectedPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </DashboardLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
              <Route path="/transactions" element={<ProtectedPage><Transactions /></ProtectedPage>} />
              <Route path="/categories" element={<ProtectedPage><Categories /></ProtectedPage>} />
              <Route path="/accounts" element={<ProtectedPage><Accounts /></ProtectedPage>} />
              <Route path="/account-dashboard" element={<ProtectedPage><AccountDashboard /></ProtectedPage>} />
              <Route path="/savings" element={<ProtectedPage><Savings /></ProtectedPage>} />
              <Route path="/debts" element={<ProtectedPage><Debts /></ProtectedPage>} />
              <Route path="/annual" element={<ProtectedPage><Annual /></ProtectedPage>} />
              <Route path="/reports" element={<ProtectedPage><Reports /></ProtectedPage>} />
              <Route path="/settings" element={<ProtectedPage><Settings /></ProtectedPage>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
