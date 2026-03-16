import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ArrowLeft, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const Wishlist = () => {
  const { wishlist, toggleWishlist, addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (wishlist.length === 0) { setProducts([]); setLoading(false); return; }
      const { data } = await supabase.from("products").select("*").in("id", wishlist);
      setProducts(data || []);
      setLoading(false);
    };
    fetch();
  }, [wishlist]);

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link to="/store" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>
          <h1 className="text-3xl font-bold">My <span className="text-primary">Wishlist</span></h1>
          <p className="text-sm text-muted-foreground mt-1">{wishlist.length} item{wishlist.length !== 1 ? "s" : ""} saved</p>
        </motion.div>

        {wishlist.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-4">
            <Heart className="w-20 h-20 mx-auto text-muted-foreground/20" />
            <p className="text-muted-foreground text-lg">Your wishlist is empty</p>
            <Link to="/store"><Button className="rounded-xl bg-primary text-primary-foreground">Browse Products</Button></Link>
          </motion.div>
        ) : loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-card border border-border/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {products.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="flex gap-4 p-4 rounded-2xl border border-border/30 bg-card"
                >
                  <div className="w-20 h-20 rounded-xl bg-muted/20 overflow-hidden flex-shrink-0">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-8 h-8 text-muted-foreground/20" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.brand} · {p.category}</p>
                    <p className="text-lg font-bold text-primary mt-1">₹{Number(p.price).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-2">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggleWishlist(p.id)} className="text-destructive hover:text-destructive/70 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                    <Button size="sm" className="rounded-xl bg-primary text-primary-foreground text-xs" onClick={() => addToCart(p)}>
                      <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Add to Cart
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
