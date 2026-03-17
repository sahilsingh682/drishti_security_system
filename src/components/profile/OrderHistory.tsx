import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, MapPin, Calendar, RefreshCw, Clock, Truck, Wrench, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface OrderHistoryProps {
  userId: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock className="w-3 h-3" />, color: "bg-yellow-500/10 text-yellow-500", label: "Pending" },
  scheduled: { icon: <Calendar className="w-3 h-3" />, color: "bg-blue-500/10 text-blue-500", label: "Scheduled" },
  in_progress: { icon: <Wrench className="w-3 h-3" />, color: "bg-orange-500/10 text-orange-500", label: "In Progress" },
  completed: { icon: <CheckCircle className="w-3 h-3" />, color: "bg-green-500/10 text-green-500", label: "Completed" },
  cancelled: { icon: <Clock className="w-3 h-3" />, color: "bg-destructive/10 text-destructive", label: "Cancelled" },
};

const PAYMENT_CONFIG: Record<string, { color: string }> = {
  pending: { color: "bg-yellow-500/10 text-yellow-500" },
  paid: { color: "bg-green-500/10 text-green-500" },
  failed: { color: "bg-destructive/10 text-destructive" },
  refunded: { color: "bg-secondary/10 text-secondary" },
};

// 🚀 SMART PARSER: Number errors aur commas ko theek karne ke liye
const parseItemsRobust = (itemsData: any) => {
  if (!itemsData) return [];
  try {
    const arr = typeof itemsData === "string" ? JSON.parse(itemsData) : itemsData;
    if (!Array.isArray(arr)) return [];
    return arr.map(item => {
      if (typeof item === 'string') {
        const parts = item.split('-');
        const priceStr = parts[1] || "0";
        return { 
            name: parts[0]?.trim() || "Item", 
            price: Number(priceStr.replace(/[^0-9.-]+/g, "")) || 0, 
            qty: 1,
            image_url: null,
            brand: null,
            category: null
        };
      }
      return {
        id: item.id,
        name: item.name || "Item",
        price: Number(String(item.price || "0").replace(/[^0-9.-]+/g, "")) || 0,
        qty: Number(item.qty) || Number(item.quantity) || 1,
        image_url: item.image_url,
        brand: item.brand,
        category: item.category,
      };
    });
  } catch (e) {
    return [];
  }
};

const parseAddress = (addr: any): string => {
  if (!addr) return "—";
  try {
    const a = typeof addr === "string" ? JSON.parse(addr) : addr;
    return [a.houseNo, a.society, a.landmark, a.area, a.city, a.state, a.pincode].filter(Boolean).join(", ");
  } catch {
    return String(addr);
  }
};

const getPaymentModeText = (order: any) => {
  if (order.payment_status !== 'paid') return "PENDING";
  if (!order.payment_method || order.payment_method === 'none') return "PAID (MODE NOT SPECIFIED)";
  return `PAID (${order.payment_method.toUpperCase()})`;
};

const StatusBadge = ({ status, type }: { status: string; type: "install" | "payment" }) => {
  const config = type === "install"
    ? STATUS_CONFIG[status] || STATUS_CONFIG.pending
    : PAYMENT_CONFIG[status] || PAYMENT_CONFIG.pending;

  const icon = type === "install" ? (STATUS_CONFIG[status]?.icon || <Clock className="w-3 h-3" />) : null;
  const label = type === "install" ? (STATUS_CONFIG[status]?.label || status.replace('_', ' ')) : status;

  return (
    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${config.color}`}>
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

    const channel = supabase
      .channel("user-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setOrders((prev) => [payload.new as any, ...prev]);
            toast.info("New order placed successfully!");
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) => prev.map((o) => (o.id === (payload.new as any).id ? payload.new : o)));
            const updated = payload.new as any;
            const old = payload.old as any;
            if (old.install_status !== updated.install_status) {
              toast.success(`Order #${updated.id.slice(0, 8)} installation is now: ${updated.install_status.replace('_', ' ')}`);
            }
            if (old.payment_status !== updated.payment_status) {
              toast.success(`Order #${updated.id.slice(0, 8)} payment marked as: ${updated.payment_status}`);
            }
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const handleReorder = (order: any) => {
    const items = parseItemsRobust(order.items);
    if (items.length === 0) { toast.error("No items to reorder"); return; }
    items.forEach((item) => {
      addToCart({
        id: item.id || crypto.randomUUID(), name: item.name, price: item.price || 0,
        image_url: item.image_url, brand: item.brand, category: item.category,
      }, item.qty);
    });
    toast.success(`${items.length} item(s) added back to cart!`);
  };

  // 🚀 NEW PROFESSIONAL PDF FOR CUSTOMERS
  const downloadInvoice = (order: any) => {
    toast.loading("Generating PDF...", { id: "pdf-toast" });
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to download PDF.");
      return;
    }

    const items = parseItemsRobust(order.items);
    const itemsHtml = items.length > 0 
      ? items.map((item: any) => `
        <tr class="border-b border-gray-100 text-gray-600 text-sm">
          <td class="py-4 px-2 text-gray-800">${item.name}</td>
          <td class="py-4 px-2 text-center">₹${item.price.toLocaleString("en-IN")}</td>
          <td class="py-4 px-2 text-center">${item.qty}</td>
          <td class="py-4 px-2 text-right text-gray-800 font-medium">₹${(item.price * item.qty).toLocaleString("en-IN")}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="4" class="py-4 px-2 text-gray-500 italic text-center border-b border-gray-100">Manual Entry / No specific items</td></tr>`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice_${order.id.slice(0, 8).toUpperCase()}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @media print {
          @page { size: A4; margin: 0; }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            background-color: white !important; 
            margin: 0; padding: 20mm;
          }
        }
        body { font-family: system-ui, -apple-system, sans-serif; background: white; color: black; }
      </style>
    </head>
    <body class="p-8 max-w-4xl mx-auto">
      
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-black text-indigo-600 tracking-tight uppercase">Drishti</h1>
          <h2 class="text-sm font-bold text-gray-600 tracking-widest uppercase mt-1">Security Systems</h2>
        </div>
        <div class="text-right text-gray-500 text-sm space-y-1">
          <p>Tagore Hostel, Geeta University</p>
          <p>Panipat, Haryana - 132145</p>
          <p>+91 98765 43210</p>
          <p class="text-indigo-600">drishtisecurity.com</p>
        </div>
      </div>

      <div class="mt-16 flex justify-between items-end">
        <div class="grid grid-cols-2 gap-8 w-2/3">
          <div>
            <h3 class="text-gray-400 font-semibold text-xs uppercase tracking-wider mb-2">Billed To:</h3>
            <p class="font-bold text-gray-800 text-lg">${order.customer_name}</p>
            <p class="text-gray-500 text-sm mt-1">${order.phone || "No phone provided"}</p>
            <p class="text-gray-500 text-sm mt-1 max-w-[200px] leading-relaxed">${parseAddress(order.delivery_address)}</p>
          </div>
          <div>
            <h3 class="text-gray-400 font-semibold text-xs uppercase tracking-wider mb-2">Date of Issue:</h3>
            <p class="text-gray-800 font-medium mb-5">${new Date(order.created_at).toLocaleDateString("en-IN", { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            
            <h3 class="text-gray-400 font-semibold text-xs uppercase tracking-wider mb-2">Invoice Number:</h3>
            <p class="text-gray-800 font-medium tracking-widest">${order.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <div class="text-right">
          <h3 class="text-gray-400 font-semibold text-xs uppercase tracking-wider mb-2">Amount Due (INR):</h3>
          <p class="text-4xl font-light text-indigo-600">₹${order.payment_status === 'paid' ? '0' : Number(order.total_amount).toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div class="mt-12">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b-2 border-indigo-600 text-indigo-600">
              <th class="py-3 px-2 font-bold text-sm">Description</th>
              <th class="py-3 px-2 font-bold text-sm text-center">Rate</th>
              <th class="py-3 px-2 font-bold text-sm text-center">Qty</th>
              <th class="py-3 px-2 font-bold text-sm text-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <div class="mt-8 flex justify-between items-start">
        <div class="w-1/2 pr-8">
          <h3 class="text-gray-400 font-semibold text-xs uppercase tracking-wider mb-3">Notes</h3>
          <p class="text-gray-500 text-sm mb-1">Payment Method: <span class="font-bold text-gray-800">${getPaymentModeText(order)}</span></p>
          <p class="text-gray-500 text-sm mb-1">Installation: <span class="font-bold text-gray-800">${order.install_status.replace('_', ' ').toUpperCase()}</span></p>
          <p class="text-gray-400 text-xs mt-6 leading-relaxed">Thank you for choosing Drishti Security Systems. This is a computer-generated invoice and does not require a physical signature.</p>
        </div>
        <div class="w-1/2 flex justify-end">
          <table class="w-64 text-sm">
            <tbody>
              <tr>
                <td class="py-2 text-gray-500">Subtotal</td>
                <td class="py-2 text-right text-gray-800 font-medium">₹${Number(order.total_amount).toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td class="py-2 text-gray-500 border-b border-gray-200">Tax (0%)</td>
                <td class="py-2 text-right text-gray-800 font-medium border-b border-gray-200">₹0</td>
              </tr>
              <tr>
                <td class="py-4 text-gray-800 font-bold text-xl">Total</td>
                <td class="py-4 text-right text-gray-800 font-bold text-xl">₹${Number(order.total_amount).toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td class="py-3 text-gray-800 font-bold text-lg border-t-2 border-indigo-600">Amount Due</td>
                <td class="py-3 text-right text-indigo-600 font-bold text-xl border-t-2 border-indigo-600">₹${order.payment_status === 'paid' ? '0' : Number(order.total_amount).toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </body>
    </html>`;

    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => {
      toast.success("PDF Ready!", { id: "pdf-toast" });
      printWindow.print();
    }, 1000);
  };

  if (loading) {
    return <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>;
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
    <div className="space-y-4">
      {orders.map((order, i) => (
        <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 space-y-4 border border-border/40 hover:border-primary/30 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">#{order.id.slice(0, 8).toUpperCase()}</span>
            <div className="flex gap-2">
              <StatusBadge status={order.payment_status} type="payment" />
              <StatusBadge status={order.install_status} type="install" />
            </div>
          </div>

          <OrderProgressBar status={order.install_status} />

          <div className="text-sm font-medium text-foreground bg-muted/20 p-3 rounded-lg border border-border/30">
            {parseItemsRobust(order.items).map((item, j) => (
              <span key={j}>{item.name} <span className="text-muted-foreground text-xs">×{item.qty}</span>{j < parseItemsRobust(order.items).length - 1 ? ", " : ""}</span>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
            <span className="text-primary font-black text-lg tracking-tight">₹{Number(order.total_amount).toLocaleString("en-IN")}</span>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground pb-2 border-b border-border/30">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
            <span className="leading-relaxed">{parseAddress(order.delivery_address)}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className={`text-xs flex-1 ${order.payment_status === 'paid' && order.install_status === 'completed' ? 'border-border/50' : 'w-full'}`} onClick={() => handleReorder(order)}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reorder
            </Button>
            
            {/* INVOICE BUTTON: Only shows when Paid & Completed */}
            {order.payment_status === 'paid' && order.install_status === 'completed' && (
              <Button size="sm" className="text-xs flex-1 bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 shadow-none transition-colors" onClick={() => downloadInvoice(order)}>
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Download Invoice
              </Button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Syncing steps with Admin panel
const STEPS = ["pending", "scheduled", "in_progress", "completed"];

const OrderProgressBar = ({ status }: { status: string }) => {
  const currentIdx = STEPS.indexOf(status);
  if (status === "cancelled") {
    return <div className="flex items-center gap-1.5 text-xs font-bold text-destructive bg-destructive/10 p-2 rounded-md w-fit"><Clock className="w-3.5 h-3.5" /> Order Cancelled</div>;
  }

  return (
    <div className="flex items-center gap-1 pt-2 pb-1">
      {STEPS.map((step, idx) => (
        <div key={step} className="flex items-center flex-1">
          <div className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${idx <= currentIdx ? "bg-primary shadow-[0_0_10px_rgba(249,115,22,0.4)]" : "bg-muted"}`} />
        </div>
      ))}
    </div>
  );
};