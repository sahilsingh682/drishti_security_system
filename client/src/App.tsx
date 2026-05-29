import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { Navbar } from "@/components/Navbar";
import { CustomCursor } from "@/components/CustomCursor";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SettingsProvider } from "@/contexts/SettingsContext";
import TechLibrary from "@/pages/TechLibrary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Store from "./pages/Store";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Contact from "./pages/Contact";
import Warranty from "./pages/Warranty";
import KitBuilder from "./pages/KitBuilder";
import Profile from "./pages/Profile";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import AdminFAQs from "./pages/admin/AdminFAQs";
import AdminPermissions from "./pages/admin/AdminPermissions";
import AdminKitBuilder from "./pages/admin/AdminKitBuilder";
import NotFound from "./pages/NotFound";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminStaff from "./pages/admin/AdminStaff"; 
import TechnicianDashboard from "./pages/TechnicianDashboard";
import TrackOrder from "./pages/TrackOrder";

// 👇 VERCEL ANALYTICS IMPORTS ADDED HERE
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
            <CartProvider>
              <CustomCursor />
              <Navbar />
              <ScrollToTop />
              
              {/* 👇 VERCEL COMPONENTS ADDED HERE */}
              <SpeedInsights />
              <Analytics />

              <Routes>
                {/* --- PUBLIC & USER ROUTES --- */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/store" element={<Store />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/warranty" element={<Warranty />} />
                <Route path="/kit-builder" element={<KitBuilder />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/technician" element={<ProtectedRoute><TechnicianDashboard /></ProtectedRoute>} />
                <Route path="/track-order" element={<TrackOrder />} />
                
                {/* --- SECURE ADMIN ROUTES --- */}
                <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="messages" element={<AdminMessages />} />
                  <Route path="testimonials" element={<AdminTestimonials />} />
                  <Route path="faqs" element={<AdminFAQs />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="permissions" element={<AdminPermissions />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="kit-builder" element={<AdminKitBuilder />} />
                  <Route path="staff" element={<AdminStaff />} /> {/* <-- YEH MISSING THA, AB ADD KAR DIYA HAI */}
                </Route>
                
                {/* --- NOT FOUND --- */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </CartProvider>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;