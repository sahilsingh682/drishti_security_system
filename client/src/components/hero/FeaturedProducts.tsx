import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  brand: string | null;
}

export const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, price, image_url, category, brand")
        .order("created_at", { ascending: false })
        .limit(4);
      if (data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-muted/30 animate-pulse aspect-[3/4]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="flex items-end justify-between mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-sm font-semibold text-primary uppercase tracking-widest">
              Top Picks
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">
              Featured Products
            </h2>
          </motion.div>
          <Link to="/store" data-clickable>
            <Button variant="ghost" className="hidden sm:flex gap-2 text-muted-foreground hover:text-primary">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
            >
              <Link to="/store" data-clickable className="group block">
                <div className="relative rounded-2xl overflow-hidden border border-border/30 bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <div className="aspect-[4/3] bg-muted/20 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
                        <ShoppingBag className="w-10 h-10 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>

                  {product.category && (
                    <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider bg-background/80 backdrop-blur-sm text-muted-foreground px-2.5 py-1 rounded-full border border-border/30">
                      {product.category}
                    </span>
                  )}

                  <div className="p-4">
                    <h3 className="font-semibold text-sm md:text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    {product.brand && (
                      <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-bold text-primary">
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-xs font-medium">4.5</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link to="/store" data-clickable>
            <Button variant="outline" className="gap-2">
              View All Products <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
