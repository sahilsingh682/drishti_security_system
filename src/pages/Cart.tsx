import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ShoppingBag, MessageCircle, Ticket, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { useState } from "react";
import { WhatsAppCheckoutModal } from "@/components/WhatsAppCheckoutModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Cart = () => {
  const { cart, removeFromCart, updateQty, clearCart, cartTotal, cartCount } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  
  // 🎟️ PROMO CODE STATES
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Apply Coupon Logic
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

  // Calculation with Discount
  const discountAmount = appliedCoupon 
    ? (appliedCoupon.discount_type === 'percentage' 
        ? (cartTotal * appliedCoupon.discount_value) / 100 
        : appliedCoupon.discount_value)
    : 0;
  
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  // 🚀 PRO FIX: Ab hum Cart se ekdum clean Data modal ko bhej rahe hain
  const cartProduct = cart.length > 0 ? {
    id: "cart-order",
    name: cart.map(i => `${i.name} x${i.quantity}`).join(", "), // For WhatsApp Msg
    price: finalTotal,
    rawItems: cart, // For Database & Invoice 
    appliedCouponCode: appliedCoupon ? appliedCoupon.code : null, // Catching Coupon
    discountAmount: discountAmount, // Catching Amount
  } : null;

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/store" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>
          <h1 className="text-3xl font-bold">Shopping <span className="text-primary">Cart</span></h1>
          <p className="text-sm text-muted-foreground mt-1">{cartCount} item{cartCount !== 1 ? "s" : ""}</p>
        </motion.div>

        {cart.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-4">
            <ShoppingCart className="w-20 h-20 mx-auto text-muted-foreground/20" />
            <p className="text-muted-foreground text-lg">Your cart is empty</p>
            <Link to="/store"><Button className="rounded-xl bg-primary text-primary-foreground">Browse Products</Button></Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="flex gap-4 p-4 rounded-2xl border border-border/30 bg-card"
                >
                  <div className="w-20 h-20 rounded-xl bg-muted/20 overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-8 h-8 text-muted-foreground/20" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.brand} · {item.category}</p>
                    <p className="text-lg font-bold text-primary mt-1">₹{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                    <div className="flex items-center gap-2 bg-muted/30 rounded-xl px-1">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} className="p-1 hover:text-primary transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} className="p-1 hover:text-primary transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 🎟️ NEW PROMO CODE SECTION */}
            <div className="p-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 flex gap-2">
              <div className="relative flex-1">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-60" />
                <Input 
                  placeholder="Enter Promo Code" 
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="pl-10 h-10 bg-background border-none ring-1 ring-border/50 focus-visible:ring-primary/50 uppercase font-mono"
                  disabled={!!appliedCoupon}
                />
              </div>
              {appliedCoupon ? (
                <Button variant="ghost" onClick={() => {setAppliedCoupon(null); setCouponInput("")}} className="text-destructive h-10 px-3">
                  <X className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleApplyCoupon} disabled={isValidating || !couponInput} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-6 font-bold">
                  {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                </Button>
              )}
            </div>

            {/* Summary */}
            <motion.div layout className="p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal ({cartCount} items)</span>
                <span>₹{cartTotal.toLocaleString()}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-green-500 font-medium">
                  <span className="flex items-center gap-1.5"><Ticket className="w-3.5 h-3.5" /> Discount ({appliedCoupon.code})</span>
                  <span>- ₹{discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border/20">
                <span>Total</span>
                <div className="text-right">
                    <span className="text-primary block">₹{finalTotal.toLocaleString()}</span>
                    {appliedCoupon && <span className="text-[10px] text-muted-foreground line-through font-normal block">₹{cartTotal.toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl border-border/40" onClick={() => {clearCart(); setAppliedCoupon(null);}}>Clear Cart</Button>
                <Button className="flex-1 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-bold" onClick={() => setShowCheckout(true)}>
                  <MessageCircle className="w-4 h-4 mr-2" /> Order via WhatsApp
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <WhatsAppCheckoutModal product={cartProduct} open={showCheckout} onClose={() => setShowCheckout(false)} onSuccess={clearCart} />
    </div>
  );
};

export default Cart;