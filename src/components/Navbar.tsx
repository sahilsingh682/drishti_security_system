import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X, User, ShoppingBag, Phone, Home, Wrench, Search, LogOut, Settings, UserCog, ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Store", path: "/store", icon: ShoppingBag },
  { label: "Kit Builder", path: "/kit-builder", icon: Wrench },
  { label: "Warranty", path: "/warranty", icon: Search },
  { label: "Contact", path: "/contact", icon: Phone },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, profile, role, signOut } = useAuth();
  const { cartCount, wishlistCount } = useCart();

  if (location.pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" data-clickable>
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 group-hover:glow-amber transition-all">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="text-primary">Drishti</span>
            <span className="text-muted-foreground ml-1 font-light">Security</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} data-clickable
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname === item.path ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >{item.label}</Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {/* Wishlist icon */}
          <Link to="/wishlist" data-clickable className="relative p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground"
              >
                {wishlistCount}
              </motion.span>
            )}
          </Link>

          {/* Cart icon */}
          <Link to="/cart" data-clickable className="relative p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-primary text-primary-foreground"
              >
                {cartCount}
              </motion.span>
            )}
          </Link>

          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-full bg-muted/50 border border-border/40 overflow-hidden flex items-center justify-center hover:border-primary/40 transition-all" data-clickable>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-border/40">
                <div className="px-3 py-2 text-xs text-muted-foreground truncate">{profile?.full_name || user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/profile" className="flex items-center gap-2"><Settings className="w-4 h-4" /> Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/wishlist" className="flex items-center gap-2"><Heart className="w-4 h-4" /> Wishlist {wishlistCount > 0 && `(${wishlistCount})`}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/cart" className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Cart {cartCount > 0 && `(${cartCount})`}</Link></DropdownMenuItem>
                {(role === "Admin" || role === "SuperAdmin") && (
                  <DropdownMenuItem asChild><Link to="/admin" className="flex items-center gap-2"><UserCog className="w-4 h-4" /> Admin Panel</Link></DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive flex items-center gap-2"><LogOut className="w-4 h-4" /> Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" data-clickable>
              <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary">
                <User className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Login</span>
              </Button>
            </Link>
          )}
          <button className="md:hidden p-2 text-muted-foreground hover:text-foreground" onClick={() => setOpen(!open)} data-clickable>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/40 overflow-hidden">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === item.path ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                ><item.icon className="w-4 h-4" />{item.label}</Link>
              ))}
              <Link to="/wishlist" onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === "/wishlist" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              ><Heart className="w-4 h-4" />Wishlist {wishlistCount > 0 && `(${wishlistCount})`}</Link>
              <Link to="/cart" onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === "/cart" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              ><ShoppingCart className="w-4 h-4" />Cart {cartCount > 0 && `(${cartCount})`}</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
