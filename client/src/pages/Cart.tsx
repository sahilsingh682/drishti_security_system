import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ShoppingBag, Ticket, X, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Cart = () => {
  const { cart, removeFromCart, updateQty, clearCart, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();
  
  // 🎟️ PROMO CODE STATES
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    
    setIsValidating(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponInput.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast.error("Invalid or expired coupon code");
        setAppliedCoupon(null);
      } else if (cartTotal < data.min_order_amount) {
        toast.error(`Minimum order of ₹${data.min_order_amount} required for this coupon`);
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data);
        toast.success(`Coupon "${data.code}" applied!`);
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsValidating(false);
    }
  };

  const discountAmount = appliedCoupon 
    ? (appliedCoupon.discount_type === 'percentage' 
        ? (cartTotal * appliedCoupon.discount_value) / 100 
        : appliedCoupon.discount_value)
    : 0;
  
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  const cartProduct = cart.length > 0 ? {
    id: "cart-order",
    name: cart.map(i => `${i.name} x${i.quantity}`).join(", "), 
    price: finalTotal,
    rawItems: cart, 
    appliedCouponCode: appliedCoupon ? appliedCoupon.code : null, 
    discountAmount: discountAmount, 
  } : null;

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/store" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>
          <h1 className="text-3xl font-black tracking-tight">Shopping <span className="text-primary">Cart</span></h1>
          <p className="text-sm text-muted-foreground mt-1">{cartCount} item{cartCount !== 1 ? "s" : ""}</p>
        </motion.div>

        {cart.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-4">
            <ShoppingCart className="w-20 h-20 mx-auto text-muted-foreground/20" />
            <p className="text-muted-foreground text-lg">Your cart is empty</p>
            <Link to="/store"><Button className="rounded-xl bg-primary text-primary-foreground h-12 px-8 font-bold">Browse Products</Button></Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="flex gap-4 p-4 rounded-2xl border border-border/40 bg-card shadow-sm"
                >
                  <div className="w-24 h-24 rounded-xl bg-muted/20 overflow-hidden flex-shrink-0 border border-border/30">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-8 h-8 text-muted-foreground/20" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="font-bold text-base text-foreground truncate">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.brand} · {item.category}</p>
                    <p className="text-lg font-black text-primary mt-2">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between py-1">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                    <div className="flex items-center gap-3 bg-muted/40 rounded-xl px-1.5 py-1 border border-border/50">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} className="p-1 hover:text-primary transition-colors"><Minus className="w-4 h-4" /></button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} className="p-1 hover:text-primary transition-colors"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 🎟️ SLEEK PROMO CODE SECTION */}
            <div className="p-1.5 rounded-2xl border border-border/50 bg-card flex gap-2 items-center transition-all focus-within:ring-2 focus-within:ring-primary/20 shadow-sm">
              <div className="relative flex-1">
                <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Enter Promo Code" 
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="pl-11 h-12 bg-transparent border-none shadow-none focus-visible:ring-0 uppercase font-bold tracking-widest text-sm"
                  disabled={!!appliedCoupon}
                />
              </div>
              {appliedCoupon ? (
                <Button variant="ghost" onClick={() => {setAppliedCoupon(null); setCouponInput("")}} className="text-destructive h-12 px-4 hover:bg-destructive/10 rounded-xl">
                  <X className="w-5 h-5" />
                </Button>
              ) : (
                <Button onClick={handleApplyCoupon} disabled={isValidating || !couponInput} className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 font-black rounded-xl uppercase tracking-widest text-xs shadow-md">
                  {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                </Button>
              )}
            </div>

            {/* 📦 ENTERPRISE SUMMARY SECTION */}
            <motion.div layout className="p-6 rounded-3xl border border-border/50 bg-card shadow-sm space-y-4">
              <h3 className="font-black text-lg border-b border-border/40 pb-3">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal ({cartCount} items)</span>
                  <span className="font-medium text-foreground">₹{cartTotal.toLocaleString()}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-emerald-500 font-bold bg-emerald-500/10 p-2.5 rounded-lg">
                    <span className="flex items-center gap-1.5"><Ticket className="w-4 h-4" /> Discount ({appliedCoupon.code})</span>
                    <span>- ₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-end pt-4 border-t border-border/40">
                <span className="text-lg font-bold text-foreground">Total</span>
                <div className="text-right">
                    {appliedCoupon && <span className="text-xs text-muted-foreground line-through font-medium block mb-0.5">₹{cartTotal.toLocaleString()}</span>}
                    <span className="text-2xl font-black text-primary block leading-none">₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* STACKED BUTTON FIX */}
              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-lg shadow-primary/20 uppercase tracking-widest" 
                  onClick={() => navigate('/checkout', { state: { product: cartProduct } })}
                >
                  <ShieldCheck className="w-5 h-5 mr-2" /> Secure Checkout
                </Button>
                
                <Button variant="ghost" className="w-full text-muted-foreground hover:text-destructive transition-colors h-12 rounded-xl" onClick={() => {clearCart(); setAppliedCoupon(null);}}>
                  Clear Entire Cart
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;