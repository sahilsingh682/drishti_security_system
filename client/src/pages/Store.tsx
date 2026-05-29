import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Eye, Star, MessageCircle, Heart, Zap, ArrowRight, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { WhatsAppCheckoutModal } from "@/components/WhatsAppCheckoutModal";

const ProductCard = ({ product, index, onView, onCheckout }: { product: any; index: number; onView: (p: any) => void; onCheckout: (p: any) => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const liked = isWishlisted(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 100, damping: 15 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative rounded-2xl overflow-hidden border border-border/30 bg-card backdrop-blur-sm"
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none z-0"
        animate={{
          boxShadow: isHovered
            ? "0 0 30px hsl(var(--primary) / 0.15), 0 20px 60px hsl(var(--primary) / 0.1)"
            : "0 0 0px transparent, 0 4px 20px hsl(var(--foreground) / 0.05)",
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Image Section */}
      <div className="relative aspect-[4/3] bg-muted/20 overflow-hidden">
        {product.image_url ? (
          <motion.img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
            <motion.div animate={{ rotate: isHovered ? 12 : 0, scale: isHovered ? 1.1 : 1 }} transition={{ duration: 0.3 }}>
              <ShoppingBag className="w-14 h-14 text-muted-foreground/20" />
            </motion.div>
          </div>
        )}

        {/* Overlay gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent"
          animate={{ opacity: isHovered ? 0.9 : 0.5 }}
          transition={{ duration: 0.3 }}
        />

        {/* Favorite button */}
        <motion.button
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-card/80 backdrop-blur-md border border-border/30 flex items-center justify-center"
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.15 }}
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
        >
          <Heart
            className={`w-4 h-4 transition-colors duration-300 ${liked ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
          />
        </motion.button>

        {/* Category pill */}
        {product.category && (
          <motion.span
            className="absolute top-3 left-3 z-10 px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase rounded-full bg-primary/90 text-primary-foreground backdrop-blur-md"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.06 + 0.2 }}
          >
            {product.category}
          </motion.span>
        )}

        {/* Quick actions on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute bottom-3 left-3 right-3 z-10 flex gap-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Button
                size="sm"
                className="flex-1 bg-primary/95 hover:bg-primary text-primary-foreground backdrop-blur-md text-xs h-9 rounded-xl"
                onClick={() => onView(product)}
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Quick View
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-card/90 hover:bg-card text-foreground backdrop-blur-md border border-border/40 text-xs h-9 rounded-xl"
                onClick={() => onCheckout(product)}
              >
                <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> Order
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
            {product.name}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground font-mono">{product.brand}</span>
          {product.stock > 0 ? (
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-500 dark:text-emerald-400">
              <Zap className="w-3 h-3" /> In Stock
            </span>
          ) : (
            <span className="text-[10px] text-destructive">Out of Stock</span>
          )}
        </div>

        {/* Features mini pills */}
        {Array.isArray(product.features) && product.features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(product.features as string[]).slice(0, 3).map((f: string) => (
              <span key={f} className="px-1.5 py-0.5 text-[9px] rounded-md bg-muted/60 text-muted-foreground border border-border/20">
                {f}
              </span>
            ))}
            {product.features.length > 3 && (
              <span className="px-1.5 py-0.5 text-[9px] rounded-md bg-muted/60 text-muted-foreground">+{product.features.length - 3}</span>
            )}
          </div>
        )}

        {/* Price row + Add to Cart */}
        <div className="flex items-center justify-between pt-1">
          <motion.span
            className="text-xl font-bold text-primary"
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.2 }}
          >
            ₹{Number(product.price).toLocaleString()}
          </motion.span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold transition-colors duration-300 border border-primary/20"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Add
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const Store = () => {
  const { user, profile } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [selected, setSelected] = useState<any | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<any | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const categories = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered = products.filter(p =>
    (cat === "All" || p.category === cat) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const displayProducts = filtered.length > 0 || products.length > 0 ? filtered : [
    { id: "1", name: "Drishti Pro 4K Dome Camera", category: "Cameras", brand: "Drishti", price: 4999, stock: 50, features: ["4K Ultra HD", "Night Vision", "IP67 Weatherproof", "AI Motion Detection"] },
    { id: "2", name: "8-Channel NVR System", category: "NVR", brand: "Drishti", price: 12999, stock: 20, features: ["8CH Playback", "4TB Storage", "H.265+", "Remote Access"] },
    { id: "3", name: "Smart Biometric Lock X1", category: "Access Control", brand: "SecureTech", price: 8499, stock: 30, features: ["Fingerprint", "RFID Card", "App Control", "Emergency Key"] },
    { id: "4", name: "PTZ Speed Dome Camera", category: "Cameras", brand: "Drishti", price: 15999, stock: 15, features: ["360° Rotation", "30x Optical Zoom", "Auto Tracking", "PoE Powered"] },
    { id: "5", name: "16-Channel DVR Recorder", category: "DVR", brand: "Drishti", price: 18999, stock: 10, features: ["16CH", "8TB Storage", "H.265+", "HDMI Output"] },
    { id: "6", name: "Wireless Alarm Kit Pro", category: "Alarms", brand: "SecureTech", price: 6999, stock: 40, features: ["433MHz", "PIR Sensors", "Door Sensors", "Siren 110dB"] },
  ];

  const displayCategories = categories.length > 1 ? categories : ["All", "Cameras", "NVR", "DVR", "Access Control", "Alarms"];

  return (
    <div className="min-h-screen bg-background grid-bg pt-20 pb-12 px-4">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <span className="text-xs font-mono tracking-[0.3em] text-primary uppercase">Product Catalog</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">Security <span className="text-gradient-amber">Store</span></h1>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-muted/30 border-border/50 rounded-xl" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {displayCategories.map(c => (
              <motion.div key={c} whileTap={{ scale: 0.95 }}>
                <Button size="sm" variant={cat === c ? "default" : "ghost"}
                  className={`rounded-xl transition-all duration-300 ${cat === c ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setCat(c)}>{c}</Button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/30 bg-card overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted/30" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted/40 rounded-lg w-3/4" />
                  <div className="h-3 bg-muted/30 rounded-lg w-1/2" />
                  <div className="h-6 bg-muted/40 rounded-lg w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {displayProducts.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  onView={setSelected}
                  onCheckout={(p) => setCheckoutProduct(p)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && displayProducts.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground">No products found</p>
          </motion.div>
        )}
      </div>

      {/* Quick View Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="border-border/40 max-w-lg bg-card backdrop-blur-xl rounded-2xl overflow-hidden p-0">
          {selected && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <div className="relative aspect-video bg-muted/20 overflow-hidden">
                {selected.image_url ? (
                  <img src={selected.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
                    <ShoppingBag className="w-16 h-16 text-muted-foreground/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              </div>
              <div className="p-6 space-y-4 -mt-8 relative z-10">
                <DialogHeader>
                  <DialogTitle className="text-xl">{selected.name}</DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-primary">₹{Number(selected.price).toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground font-mono">{selected.brand} · {selected.category}</span>
                </div>
                {Array.isArray(selected.features) && selected.features.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-foreground">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selected.features as string[]).map((f: string) => (
                        <span key={f} className="px-3 py-1.5 text-xs rounded-xl bg-primary/10 text-primary border border-primary/20 font-medium">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-sm font-semibold"
                    onClick={() => { addToCart(selected); setSelected(null); }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-border/40 rounded-xl h-12 text-sm font-semibold"
                    onClick={() => { setSelected(null); setCheckoutProduct(selected); }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>

      <WhatsAppCheckoutModal product={checkoutProduct} open={!!checkoutProduct} onClose={() => setCheckoutProduct(null)} />
    </div>
  );
};

export default Store;
