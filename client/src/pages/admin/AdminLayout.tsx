import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, ShoppingCart, Package, Users, MessageSquare, Menu, X, LogOut, Shield, User, Star, HelpCircle, Store, Moon, Sun, ChevronsLeft, ChevronsRight, Wrench, Settings, Ticket } from "lucide-react"; // <-- Yahan Wrench add ho gaya
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const ALL_NAV_ITEMS = [
  { label: "Dashboard", path: "/admin", icon: BarChart3, key: "dashboard" },
  { label: "Orders", path: "/admin/orders", icon: ShoppingCart, key: "orders" },
  { label: "Products", path: "/admin/products", icon: Package, key: "products" },
  { label: "Kit Builder", path: "/admin/kit-builder", icon: Wrench, key: "kit-builder" }, // <-- Yahan Kit Builder ka Link aa gaya
  { label: "Messages", path: "/admin/messages", icon: MessageSquare, key: "messages" },
  { label: "Testimonials", path: "/admin/testimonials", icon: Star, key: "testimonials" },
  { label: "FAQs", path: "/admin/faqs", icon: HelpCircle, key: "faqs" },
  { label: "Users", path: "/admin/users", icon: Users, key: "users", superAdminOnly: true },
  { label: "Permissions", path: "/admin/permissions", icon: Shield, key: "permissions", superAdminOnly: true },
  { label: "Coupons", path: "/admin/coupons", icon: Ticket, key: "coupons" },
  { label: "Staff", path: "/admin/staff", icon: Users, key: "staff", superAdminOnly: true },
  { label: "Settings", path: "/admin/settings", icon: Settings, key: "settings" },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [adminPermissions, setAdminPermissions] = useState<string[]>([]);
  const { profile, role, signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  // Load permissions for Admin role (SuperAdmin gets all)
  useEffect(() => {
    if (role === "Admin" && user) {
      supabase
        .from("admin_permissions")
        .select("page_key")
        .eq("user_id", user.id)
        .then(({ data }) => {
          setAdminPermissions(data?.map(d => d.page_key) || []);
        });
    }
  }, [role, user]);

  const filteredNav = ALL_NAV_ITEMS.filter(item => {
    if (item.superAdminOnly) return role === "SuperAdmin";
    if (role === "SuperAdmin") return true;
    // Admins can access pages they have permission for
    return adminPermissions.includes(item.key);
  });

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className={`p-4 border-b border-border/30 flex items-center ${collapsed && !isMobile ? "justify-center" : "justify-between"}`}>
        {collapsed && !isMobile ? (
          <Shield className="w-5 h-5 text-primary" />
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-bold text-sm">
                <span className="text-primary">Drishti</span> Admin
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">{role}</span>
          </div>
        )}
        {/* Close button for mobile */}
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} className="p-1 text-muted-foreground hover:text-foreground" data-clickable>
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            onClick={() => setSidebarOpen(false)}
            title={collapsed && !isMobile ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center ${collapsed && !isMobile ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!(collapsed && !isMobile) && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle - desktop only */}
      {!isMobile && (
        <div className="px-3 pt-2">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="flex items-center justify-center w-full py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            data-clickable
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        </div>
      )}

      <div className="p-3 border-t border-border/30">
        {collapsed && !isMobile ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted/50 border border-border/40 overflow-hidden flex items-center justify-center shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <button onClick={toggle} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" data-clickable aria-label="Toggle theme" title="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => navigate("/store")} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" data-clickable title="Back to Store">
              <Store className="w-4 h-4" />
            </button>
            <button onClick={signOut} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" data-clickable title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-muted/50 border border-border/40 overflow-hidden flex items-center justify-center shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <span className="text-sm font-medium truncate">{profile?.full_name || "Admin"}</span>
              <button onClick={toggle} className="ml-auto p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" data-clickable aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
            <button onClick={() => { setSidebarOpen(false); navigate("/store"); }} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 w-full transition-all" data-clickable>
              <Store className="w-4 h-4" /> Back to Store
            </button>
            <button onClick={signOut} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full transition-all" data-clickable>
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </>
        )}
      </div>
    </div>
  );

  const sidebarWidth = collapsed ? "w-16" : "w-60";
  const marginLeft = collapsed ? "md:ml-16" : "md:ml-60";

  return (
    <div className="min-h-screen bg-background grid-bg flex">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex ${sidebarWidth} bg-card/40 backdrop-blur-xl border-r border-border/30 flex-col fixed top-0 left-0 h-screen z-40 transition-all duration-300`}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 md:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed top-0 left-0 w-72 h-screen bg-card/95 backdrop-blur-xl border-r border-border/30 z-50 md:hidden shadow-xl">
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className={`flex-1 ${marginLeft} flex flex-col min-h-screen transition-all duration-300`}>
        {/* Mobile top header */}
        <header className="md:hidden sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border/30 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground" data-clickable>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm">
              <span className="text-primary">Drishti</span> Admin
            </span>
          </div>
          <div className="w-8" /> {/* Spacer for centering */}
        </header>

        {/* Mobile bottom tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border/30 safe-area-bottom">
          <div className="flex justify-around py-1.5 px-1">
            {filteredNav.slice(0, 5).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg text-[10px] transition-all min-w-0 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`
                }
              >
                <item.icon className="w-4.5 h-4.5" />
                <span className="truncate max-w-[56px]">{item.label}</span>
              </NavLink>
            ))}
            <button onClick={() => setSidebarOpen(true)} className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 text-[10px] text-muted-foreground min-w-0" data-clickable>
              <Menu className="w-4.5 h-4.5" />
              <span>More</span>
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 md:p-8 pb-24 md:pb-8">
          {/* Breadcrumb */}
          <div className="text-xs text-muted-foreground mb-3 md:mb-4 font-mono">
            Admin / {ALL_NAV_ITEMS.find(n => location.pathname === n.path || (n.path !== "/admin" && location.pathname.startsWith(n.path)))?.label || "Dashboard"}
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;