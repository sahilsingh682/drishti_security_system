import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  brand?: string | null;
  category?: string | null;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (product: any, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  toggleWishlist: (id: string) => void;
  isWishlisted: (id: string) => boolean;
  wishlistCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem("drishti_cart") || "[]"); } catch { return []; }
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("drishti_wishlist") || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem("drishti_cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("drishti_wishlist", JSON.stringify(wishlist)); }, [wishlist]);

  const addToCart = (product: any, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        toast.success(`Updated quantity for ${product.name}`);
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      toast.success(`${product.name} added to cart`);
      return [...prev, { id: product.id, name: product.name, price: product.price, image_url: product.image_url, brand: product.brand, category: product.category, quantity: qty }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
    toast.info("Removed from cart");
  };

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return removeFromCart(id);
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const toggleWishlist = (id: string) => {
    setWishlist(prev => {
      if (prev.includes(id)) {
        toast.info("Removed from wishlist");
        return prev.filter(x => x !== id);
      }
      toast.success("Added to wishlist");
      return [...prev, id];
    });
  };

  const isWishlisted = (id: string) => wishlist.includes(id);
  const wishlistCount = wishlist.length;

  return (
    <CartContext.Provider value={{ cart, wishlist, addToCart, removeFromCart, updateQty, clearCart, cartCount, cartTotal, toggleWishlist, isWishlisted, wishlistCount }}>
      {children}
    </CartContext.Provider>
  );
};
