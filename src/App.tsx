import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Accounts from "./pages/Accounts";
import AccountDashboard from "./pages/AccountDashboard";
import Savings from "./pages/Savings";
import Debts from "./pages/Debts";
import Annual from "./pages/Annual";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          } />
          <Route path="/transactions" element={
            <DashboardLayout>
              <Transactions />
            </DashboardLayout>
          } />
          <Route path="/categories" element={
            <DashboardLayout>
              <Categories />
            </DashboardLayout>
          } />
          <Route path="/accounts" element={
            <DashboardLayout>
              <Accounts />
            </DashboardLayout>
          } />
          <Route path="/account-dashboard" element={
            <DashboardLayout>
              <AccountDashboard />
            </DashboardLayout>
          } />
          <Route path="/savings" element={
            <DashboardLayout>
              <Savings />
            </DashboardLayout>
          } />
          <Route path="/debts" element={
            <DashboardLayout>
              <Debts />
            </DashboardLayout>
          } />
          <Route path="/annual" element={
            <DashboardLayout>
              <Annual />
            </DashboardLayout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
