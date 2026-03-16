import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, MapPin, Calendar, RefreshCw, ShoppingCart, CheckCircle, Clock, Truck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface OrderHistoryProps {
  userId: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock className="w-3 h-3" />, color: "bg-yellow-500/10 text-yellow-500", label: "Pending" },
  confirmed: { icon: <CheckCircle className="w-3 h-3" />, color: "bg-blue-500/10 text-blue-500", label: "Confirmed" },
  processing: { icon: <Wrench className="w-3 h-3" />, color: "bg-orange-500/10 text-orange-500", label: "Processing" },
  shipped: { icon: <Truck className="w-3 h-3" />, color: "bg-indigo-500/10 text-indigo-500", label: "Shipped" },
  delivered: { icon: <CheckCircle className="w-3 h-3" />, color: "bg-green-500/10 text-green-500", label: "Delivered" },
  installed: { icon: <CheckCircle className="w-3 h-3" />, color: "bg-green-500/10 text-green-500", label: "Installed" },
  cancelled: { icon: <Clock className="w-3 h-3" />, color: "bg-destructive/10 text-destructive", label: "Cancelled" },
};

const PAYMENT_CONFIG: Record<string, { color: string }> = {
  pending: { color: "bg-yellow-500/10 text-yellow-500" },
  paid: { color: "bg-green-500/10 text-green-500" },
  failed: { color: "bg-destructive/10 text-destructive" },
};

const parseItems = (items: any): { id?: string; name: string; qty: number; price?: number; image_url?: string; brand?: string; category?: string }[] => {
  try {
    const arr = typeof items === "string" ? JSON.parse(items) : items;
    if (Array.isArray(arr)) return arr.map((i: any) => ({
      id: i.id,
      name: i.name || "Item",
      qty: i.qty || i.quantity || 1,
      price: i.price,
      image_url: i.image_url,
      brand: i.brand,
      category: i.category,
    }));
  } catch {}
  return [];
};

const parseAddress = (addr: any): string => {
  if (!addr) return "—";
  try {
    const a = typeof addr === "string" ? JSON.parse(addr) : addr;
    return [a.houseNo, a.society, a.area, a.city, a.state, a.pincode].filter(Boolean).join(", ");
  } catch {
    return String(addr);
  }
};

const StatusBadge = ({ status, type }: { status: string; type: "install" | "payment" }) => {
  const config = type === "install"
    ? STATUS_CONFIG[status] || STATUS_CONFIG.pending
    : PAYMENT_CONFIG[status] || PAYMENT_CONFIG.pending;

  const icon = type === "install" ? (STATUS_CONFIG[status]?.icon || <Clock className="w-3 h-3" />) : null;
  const label = type === "install" ? (STATUS_CONFIG[status]?.label || status) : status;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${config.color}`}>
      {icon}
      {label}
    </span>
  );
};

export const OrderHistory = ({ userId }: OrderHistoryProps) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    fetchOrders();

    // Realtime subscription for order updates
    const channel = supabase
      .channel("user-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setOrders((prev) => [payload.new as any, ...prev]);
            toast.info("New order received!");
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) => (o.id === (payload.new as any).id ? payload.new : o))
            );
            const updated = payload.new as any;
            const old = payload.old as any;
            if (old.install_status !== updated.install_status) {
              toast.success(`Order #${updated.id.slice(0, 8)} status: ${updated.install_status}`);
            }
            if (old.payment_status !== updated.payment_status) {
              toast.success(`Order #${updated.id.slice(0, 8)} payment: ${updated.payment_status}`);
            }
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleReorder = (order: any) => {
    const items = parseItems(order.items);
    if (items.length === 0) {
      toast.error("No items to reorder");
      return;
    }
    items.forEach((item) => {
      addToCart({
        id: item.id || crypto.randomUUID(),
        name: item.name,
        price: item.price || 0,
        image_url: item.image_url,
        brand: item.brand,
        category: item.category,
      }, item.qty);
    });
    toast.success(`${items.length} item(s) added back to cart!`);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Package className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
        <p className="text-muted-foreground">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order, i) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8)}</span>
            <div className="flex gap-2">
              <StatusBadge status={order.payment_status} type="payment" />
              <StatusBadge status={order.install_status} type="install" />
            </div>
          </div>

          {/* Status Progress Bar */}
          <OrderProgressBar status={order.install_status} />

          <div className="text-sm font-semibold text-foreground">
            {parseItems(order.items).map((item, j) => (
              <span key={j}>{item.name} ×{item.qty}{j < parseItems(order.items).length - 1 ? ", " : ""}</span>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span className="text-primary font-bold text-sm">₹{Number(order.total_amount).toLocaleString()}</span>
          </div>
          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{parseAddress(order.delivery_address)}</span>
          </div>

          {/* Reorder Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-1 border-border/50 text-xs"
            onClick={() => handleReorder(order)}
          >
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Reorder
          </Button>
        </motion.div>
      ))}
    </div>
  );
};

const STEPS = ["pending", "confirmed", "processing", "shipped", "installed"];

const OrderProgressBar = ({ status }: { status: string }) => {
  const currentIdx = STEPS.indexOf(status);
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-1 text-xs text-destructive">
        <Clock className="w-3 h-3" /> Order Cancelled
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, idx) => (
        <div key={step} className="flex items-center flex-1">
          <div
            className={`h-1.5 rounded-full flex-1 transition-colors ${
              idx <= currentIdx ? "bg-primary" : "bg-muted"
            }`}
          />
        </div>
      ))}
    </div>
  );
};
