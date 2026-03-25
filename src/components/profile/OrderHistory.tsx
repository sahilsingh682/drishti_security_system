import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, MapPin, Calendar, RefreshCw, Clock, Truck, Wrench, CheckCircle, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

const parseItemsRobust = (itemsData: any) => {
  if (!itemsData) return [];
  try {
    const arr = typeof itemsData === "string" ? JSON.parse(itemsData) : itemsData;
    if (!Array.isArray(arr)) return [];
    return arr.map((item: any) => {
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
        serial_number: item.serial_number || "", 
        warranty_months: item.warranty_months || "",
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
  const navigate = useNavigate(); 

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
    navigate('/cart'); 
  };

  // 🚀 FIXED: DOWNLOAD INVOICE AB DISCOUNT AUR COUPONS BHI DIKHAYEGA
  const downloadInvoice = (order: any) => {
    toast.loading("Generating Tax Invoice...", { id: "pdf-toast" });

    const items = parseItemsRobust(order.items);
    
    // 1. Calculate the Raw Subtotal (Before Discount)
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0);
    
    // 2. Fetch the Final Paid Amount from DB
    const finalTotal = Number(order.total_amount) || 0;
    
    // 3. Smart Discount Calculation:
    // Pehle DB se check karega ki koi explicit discount tha kya.
    // Agar nahi tha, par Subtotal > Final Total hai, iska matlab kuch toh discount laga tha (fallback mechanism)
    const discountAmount = Number(order.discount_amount) || (subtotal > finalTotal ? subtotal - finalTotal : 0);
    const hasDiscount = discountAmount > 0;

    // 4. Tax is ALWAYS calculated on the Final Paid Amount
    const baseAmount = finalTotal / 1.18;
    const totalGst = finalTotal - baseAmount;
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;

    const itemsHtml = items.length > 0 
      ? items.map((item: any) => `
        <tr class="border-b border-gray-100 text-gray-700 text-sm">
          <td class="py-4 px-2">
            <p class="font-bold text-gray-900">${item.name}</p>
            ${item.serial_number ? `<p class="text-[10px] font-mono text-gray-500 mt-1">S/N: ${item.serial_number}</p>` : ''}
          </td>
          <td class="py-4 px-2 text-center text-xs text-gray-500">${item.warranty_months ? `${item.warranty_months}M` : 'N/A'}</td>
          <td class="py-4 px-2 text-center">₹${item.price.toLocaleString("en-IN")}</td>
          <td class="py-4 px-2 text-center font-bold">${item.qty}</td>
          <td class="py-4 px-2 text-right text-gray-900 font-bold">₹${(item.price * item.qty).toLocaleString("en-IN")}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="5" class="py-4 px-2 text-gray-500 italic text-center border-b border-gray-100">Details unavailable</td></tr>`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Tax_Invoice_${order.id.slice(0, 8).toUpperCase()}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background-color: white !important; margin: 0; padding: 20mm; }
        }
        body { font-family: system-ui, -apple-system, sans-serif; background: white; color: black; }
      </style>
    </head>
    <body class="p-8 max-w-4xl mx-auto">
      <div class="flex justify-between items-start border-b-2 border-orange-500 pb-6 mb-8">
        <div>
          <h1 class="text-4xl font-black text-orange-600 tracking-tighter uppercase italic">Drishti</h1>
          <h2 class="text-sm font-black text-gray-800 tracking-widest uppercase mt-1">Security System</h2>
          <div class="mt-4 text-xs font-medium text-gray-500 space-y-1">
             <p>Panipat, Haryana, India</p>
             <p>Phone: +91 8787225596</p>
             <p class="font-bold text-gray-800 pt-1">GSTIN: 06DRISH715E1Z5</p>
          </div>
        </div>
        <div class="text-right">
          <h3 class="text-3xl font-black text-gray-200 uppercase tracking-widest">Tax Invoice</h3>
          <p class="text-sm font-bold text-gray-800 mt-2">INV-${order.id.slice(0, 8).toUpperCase()}</p>
          <p class="text-xs font-semibold text-gray-500 mt-1">Date: ${new Date(order.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <div class="mt-4 inline-block px-3 py-1 bg-gray-100 rounded text-xs font-black text-gray-600 uppercase">
             Status: ${order.payment_status === 'paid' ? 'PAID / COMPLETED' : 'PAYMENT PENDING'}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 class="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-2">Billed To:</h3>
          <p class="font-black text-gray-800 text-lg">${order.customer_name}</p>
          <p class="text-gray-600 text-sm mt-1 font-medium">${order.phone || "No phone provided"}</p>
          <p class="text-gray-500 text-xs mt-1 leading-relaxed max-w-[250px]">${parseAddress(order.delivery_address)}</p>
        </div>
        <div class="text-right">
          <h3 class="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-2">Installation & Payment:</h3>
          <p class="text-sm font-bold text-gray-800 uppercase">${order.installation_type === 'technician' ? 'Drishti Expert Team' : 'Customer Self Install'}</p>
          <p class="text-sm font-bold text-gray-800 uppercase mt-1">${getPaymentModeText(order)}</p>
        </div>
      </div>

      <table class="w-full text-left mb-8 border-collapse">
        <thead>
          <tr class="bg-gray-100 text-gray-800 text-[10px] uppercase font-black tracking-widest">
            <th class="py-3 px-4 rounded-l-lg">Description & S/N</th>
            <th class="py-3 px-4 text-center">Warranty</th>
            <th class="py-3 px-4 text-center">Rate</th>
            <th class="py-3 px-4 text-center">Qty</th>
            <th class="py-3 px-4 text-right rounded-r-lg">Total</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          ${itemsHtml}
        </tbody>
      </table>

      <div class="flex justify-end border-t-2 border-gray-800 pt-6 mb-12">
        <div class="w-80 space-y-3">
          
          <div class="flex justify-between text-sm font-bold text-gray-600">
            <span>Subtotal (Items):</span>
            <span>₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          ${hasDiscount ? `
          <div class="flex justify-between text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 -mx-2 rounded">
            <span>Discount Applied ${order.applied_coupon_code ? `(${order.applied_coupon_code})` : ''}:</span>
            <span>- ₹${discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          ` : ''}

          <div class="flex justify-between text-sm font-bold text-gray-600 pt-2 border-t border-gray-100 mt-2">
            <span>Taxable Value ${hasDiscount ? '(Post Discount)' : ''}:</span>
            <span>₹${baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="flex justify-between text-sm font-bold text-gray-600">
            <span>CGST @ 9%:</span>
            <span>₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="flex justify-between text-sm font-bold text-gray-600">
            <span>SGST @ 9%:</span>
            <span>₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="flex justify-between text-xl font-black text-orange-600 pt-4 border-t border-gray-200 mt-2">
            <span>Grand Total:</span>
            <span>₹${finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
      
      <div class="text-[10px] font-medium text-gray-400 leading-relaxed border-t border-gray-100 pt-6">
        <p class="font-bold text-gray-600 mb-1">Terms & Conditions:</p>
        <p>1. Warranty is strictly applicable against manufacturing defects only. Physical damage is not covered.</p>
        <p>2. Please retain this tax invoice and product serial numbers for any warranty claims. Verify warranty 24/7 on our website.</p>
        <p>3. Tax is calculated on the final discounted value as per government regulations.</p>
      </div>
    </body>
    </html>`;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.write(html);
      iframeDoc.close();
      
      iframe.onload = () => {
        setTimeout(() => {
          toast.success("Tax Invoice Ready!", { id: "pdf-toast" });
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        }, 500); 
      };
    } else {
       toast.error("Failed to generate PDF.", { id: "pdf-toast" });
    }
  };

  if (loading) return <div className="text-center py-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>;

  if (orders.length === 0) {
    return (
      <div className="glass-card p-8 text-center border-2 border-dashed border-border/40">
        <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-bold">No orders yet</h3>
        <p className="text-sm text-muted-foreground mb-6 mt-1">Looks like you haven't secured your space yet.</p>
        <Button onClick={() => navigate('/store')} className="bg-primary text-white hover:bg-primary/90 rounded-full px-8">
          Explore Security Kits
        </Button>
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
              <span key={j}>{item.name.replace(/\[Applied Coupon:.*?\]/g, '').trim()} <span className="text-muted-foreground text-xs">×{item.qty}</span>{j < parseItemsRobust(order.items).length - 1 ? ", " : ""}</span>
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

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className={`text-xs flex-1 border-border/50`} onClick={() => handleReorder(order)}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reorder
            </Button>
            
            {order.payment_status === 'paid' && order.install_status === 'completed' && (
              <Button size="sm" className="text-xs flex-1 bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 shadow-none transition-colors" onClick={() => downloadInvoice(order)}>
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Tax Invoice
              </Button>
            )}

            {order.install_status === 'completed' && (
              <Button size="sm" className="text-xs flex-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 shadow-none transition-colors" onClick={() => navigate('/warranty')}>
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Warranty
              </Button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

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