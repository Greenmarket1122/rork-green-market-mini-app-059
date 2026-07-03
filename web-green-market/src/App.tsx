import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import BottomNav from "@/components/BottomNav";
import { StoreProvider } from "@/context/StoreContext";
import { initTelegram } from "@/lib/telegram";

import Address from "./pages/Address";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLock from "./pages/AdminLock";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import OrderTracking from "./pages/OrderTracking";
import ProductDetail from "./pages/ProductDetail";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

/** Guard for admin dashboard — checks sessionStorage auth flag */
function AdminGuard() {
  const authed = sessionStorage.getItem("gm_admin_auth") === "true";
  if (!authed) return <Navigate to="/admin" replace />;
  return <AdminDashboard />;
}

function AppShell() {
  useEffect(() => {
    initTelegram();
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <Routes>
        {/* Admin routes — no bottom nav */}
        <Route path="/admin" element={<AdminLock />} />
        <Route path="/admin/dashboard" element={<AdminGuard />} />

        {/* Customer routes */}
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/address" element={<Address />} />
        <Route path="/track/:orderNumber" element={<OrderTracking />} />
        <Route path="/track" element={<OrderTracking />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <StoreProvider>
        <AppShell />
      </StoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
