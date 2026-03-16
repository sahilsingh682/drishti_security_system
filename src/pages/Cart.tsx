import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ShoppingBag, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom";
import { useState } from "react";
import { WhatsAppCheckoutModal } from "@/components/WhatsAppCheckoutModal";

const Cart = () => {
  const { cart, removeFromCart, updateQty, clearCart, cartTotal, cartCount } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  const cartProduct = cart.length > 0 ? {
    id: "cart-order",
    name: cart.map(i => `${i.name} x${i.quantity}`).join(", "),
    price: cartTotal,
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

            {/* Summary */}
            <motion.div layout className="p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal ({cartCount} items)</span>
                <span>₹{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span className="text-primary">₹{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl border-border/40" onClick={clearCart}>Clear Cart</Button>
                <Button className="flex-1 rounded-xl bg-primary text-primary-foreground" onClick={() => setShowCheckout(true)}>
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
