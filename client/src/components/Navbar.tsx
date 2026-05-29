import { useState, useEffect } from "react";
// 🚀 FIXED: Added 'Link' to imports
import { Link, useLocation, useNavigate } from "react-router-dom"; 
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Menu, X, User, ShoppingBag, Phone, Home, 
  Wrench, Search, LogOut, Settings, UserCog, ShoppingCart, Heart ,Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSettings } from "@/contexts/SettingsContext";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Store", path: "/store", icon: ShoppingBag },
  { label: "Kit Builder", path: "/kit-builder", icon: Wrench },
  { label: "Warranty", path: "/warranty", icon: Search },
  { label: "Track Order", path: "/track-order", icon: Package },
  { label: "Contact", path: "/contact", icon: Phone },
];

export const Navbar = () => {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();
  const { cartCount, wishlistCount } = useCart();
  
  const [isTechnician, setIsTechnician] = useState(false);

  useEffect(() => {
    const checkStaffStatus = async () => {
      if (!user?.email) {
        setIsTechnician(false);
        return;
      }
      try {
        const { data } = await supabase
          .from("staff")
          .select("id")
          .eq("email", user.email)
          .eq("is_active", true)
          .maybeSingle();
        
        if (data) {
          setIsTechnician(true);
        } else {
          setIsTechnician(false);
        }
      } catch (err) {
        console.error("Staff check failed", err);
      }
    };
    checkStaffStatus();
  }, [user]);

  if (location.pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo - Technician ke liye Dashboard par le jayega */}
        <Link to={isTechnician ? "/technician" : "/"} className="flex items-center gap-2 group">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 group-hover:glow-amber transition-all">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-primary">Drishti</span>
            <span className="text-muted-foreground ml-1 font-light italic">
              {isTechnician ? "Expert" : "Security"}
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {isTechnician ? (
            <>
              <Link to="/technician" className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${location.pathname === '/technician' ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}>My Tasks</Link>
              <Link to="/store" className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === '/store' ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}>Products Info</Link>
              <Link to="/warranty" className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === '/warranty' ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}>Warranty Check</Link>
            </>
          ) : (
            navItems.map((item) => (
              <Link key={item.path} to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === item.path ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >{item.label}</Link>
            ))
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Customer specific icons hidden for Technician */}
          {!isTechnician && (
            <div className="flex items-center gap-1">
              <Link to="/wishlist" className="relative p-2 rounded-lg text-muted-foreground hover:text-primary">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] flex items-center justify-center rounded-full bg-destructive text-white">{wishlistCount}</span>}
              </Link>
              <Link to="/cart" className="relative p-2 rounded-lg text-muted-foreground hover:text-primary">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] flex items-center justify-center rounded-full bg-primary text-white">{cartCount}</span>}
              </Link>
            </div>
          )}

          <ThemeToggle />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-full bg-muted/50 border border-border/40 overflow-hidden flex items-center justify-center hover:border-primary/40 transition-all">
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-muted-foreground" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-border/40">
                <div className="px-3 py-2 text-xs text-muted-foreground truncate font-black uppercase tracking-tighter">
                  {isTechnician ? "Technician Mode" : (profile?.full_name || user.email)}
                </div>
                <DropdownMenuSeparator />
                {isTechnician ? (
                  <DropdownMenuItem asChild><Link to="/technician" className="flex items-center gap-2 font-bold"><Wrench className="w-4 h-4" /> My Dashboard</Link></DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild><Link to="/profile" className="flex items-center gap-2"><Settings className="w-4 h-4" /> Profile</Link></DropdownMenuItem>
                )}
                {(role === "Admin" || role === "SuperAdmin") && (
                  <DropdownMenuItem asChild><Link to="/admin" className="flex items-center gap-2 text-primary font-bold"><UserCog className="w-4 h-4" /> Admin Panel</Link></DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive flex items-center gap-2 font-black cursor-pointer uppercase text-xs tracking-widest"><LogOut className="w-4 h-4" /> Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" className="border-primary/30 text-primary">Login</Button>
            </Link>
          )}
          
          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-muted-foreground hover:text-foreground" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/40 overflow-hidden px-4 py-3 space-y-1">
              {isTechnician ? (
                <>
                  <Link to="/technician" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-primary bg-primary/10"><Wrench className="w-4 h-4" />My Tasks</Link>
                  <Link to="/store" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground"><ShoppingBag className="w-4 h-4" />Products</Link>
                  <Link to="/warranty" onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground"><Search className="w-4 h-4" />Warranty</Link>
                </>
              ) : (
                navItems.map((item) => (
                  <Link key={item.path} to={item.path} onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      location.pathname === item.path ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  ><item.icon className="w-4 h-4" />{item.label}</Link>
                ))
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};