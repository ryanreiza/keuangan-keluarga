import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Accounts from "./pages/Accounts";
import AccountDashboard from "./pages/AccountDashboard";
import Savings from "./pages/Savings";
import Debts from "./pages/Debts";
import Annual from "./pages/Annual";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Transactions />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/categories" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Categories />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/accounts" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Accounts />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/account-dashboard" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AccountDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/savings" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Savings />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/debts" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Debts />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/annual" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Annual />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Reports />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
