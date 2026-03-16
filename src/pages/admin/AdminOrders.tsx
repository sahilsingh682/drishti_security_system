import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Phone, MapPin, CreditCard, Wrench, Plus, FileText, Package, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const paymentColors: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  paid: "bg-green-500/15 text-green-500 border-green-500/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  refunded: "bg-secondary/15 text-secondary border-secondary/30",
};

const installColors: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
  scheduled: "bg-secondary/15 text-secondary border-secondary/30",
  in_progress: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-green-500/15 text-green-500 border-green-500/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [manualForm, setManualForm] = useState({
    customer_name: "",
    phone: "",
    total_amount: "",
    items_text: "",
    payment_status: "pending",
    install_status: "pending",
    address_houseNo: "",
    address_society: "",
    address_city: "",
    address_state: "",
    address_pincode: "",
    address_landmark: "",
  });

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("orders").update({ [field]: value }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Status updated");
    fetchOrders();
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Delete this order permanently?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Order deleted");
    fetchOrders();
  };

  const generateInvoice = (order: any) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const addr = order.delivery_address as any;
    const invoiceText = `
══════════════════════════════════════
        DRISHTI SECURITY SYSTEMS
            TAX INVOICE
══════════════════════════════════════
Invoice #: ${order.id.slice(0, 8).toUpperCase()}
Date: ${new Date(order.created_at).toLocaleDateString("en-IN")}

Customer: ${order.customer_name}
Phone: ${order.phone || "N/A"}
Address: ${addr ? `${addr.houseNo || ""} ${addr.society || ""}, ${addr.area || ""}, ${addr.city || ""}, ${addr.state || ""} - ${addr.pincode || ""}` : "N/A"}

──────────────────────────────────────
ITEMS:
${items.length > 0 ? items.map((item: any, i: number) => `  ${i + 1}. ${item.name || item} ${item.price ? `- ₹${item.price}` : ""}`).join("\n") : "  Walk-in / Manual Order"}

──────────────────────────────────────
TOTAL: ₹${Number(order.total_amount).toLocaleString("en-IN")}
Payment: ${order.payment_status.toUpperCase()}
Installation: ${order.install_status.toUpperCase()}
══════════════════════════════════════
    `.trim();

    const blob = new Blob([invoiceText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${order.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoice downloaded");
  };

  const addManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = manualForm.items_text
      ? manualForm.items_text.split("\n").filter(Boolean).map(line => {
          const parts = line.split("-").map(s => s.trim());
          return { name: parts[0], price: parts[1] ? Number(parts[1]) : 0 };
        })
      : [];

    const delivery_address = manualForm.address_society
      ? {
          houseNo: manualForm.address_houseNo,
          society: manualForm.address_society,
          city: manualForm.address_city,
          state: manualForm.address_state,
          pincode: manualForm.address_pincode,
          landmark: manualForm.address_landmark,
        }
      : null;

    const { error } = await supabase.from("orders").insert({
      customer_name: manualForm.customer_name,
      phone: manualForm.phone || null,
      total_amount: Number(manualForm.total_amount) || 0,
      items,
      delivery_address,
      payment_status: manualForm.payment_status,
      install_status: manualForm.install_status,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Order added");
    setManualOpen(false);
    setManualForm({ customer_name: "", phone: "", total_amount: "", items_text: "", payment_status: "pending", install_status: "pending", address_houseNo: "", address_society: "", address_city: "", address_state: "", address_pincode: "", address_landmark: "" });
    fetchOrders();
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.payment_status === filter || o.install_status === filter);

  const stats = {
    total: orders.length,
    paid: orders.filter(o => o.payment_status === "paid").length,
    pending: orders.filter(o => o.payment_status === "pending").length,
    completed: orders.filter(o => o.install_status === "completed").length,
    revenue: orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + Number(o.total_amount), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="w-6 h-6 text-primary" /> Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">{orders.length} total orders · ₹{stats.revenue.toLocaleString("en-IN")} revenue</p>
        </div>
        <Dialog open={manualOpen} onOpenChange={setManualOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Add Manual Order</Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border/40 max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Manual Order</DialogTitle></DialogHeader>
            <form onSubmit={addManualOrder} className="space-y-3">
              <div><Label>Customer Name *</Label><Input required value={manualForm.customer_name} onChange={e => setManualForm({ ...manualForm, customer_name: e.target.value })} className="bg-muted/30" /></div>
              <div><Label>Phone</Label><Input value={manualForm.phone} onChange={e => setManualForm({ ...manualForm, phone: e.target.value })} className="bg-muted/30" placeholder="+91 98765 43210" /></div>
              <div><Label>Total Amount (₹) *</Label><Input type="number" required value={manualForm.total_amount} onChange={e => setManualForm({ ...manualForm, total_amount: e.target.value })} className="bg-muted/30" /></div>
              <div>
                <Label>Products / Items <span className="text-muted-foreground text-xs">(one per line: Name - Price)</span></Label>
                <Textarea rows={3} placeholder={"Hikvision 2MP Dome - 1500\nDVR 4CH - 3500"} value={manualForm.items_text} onChange={e => setManualForm({ ...manualForm, items_text: e.target.value })} className="bg-muted/30 font-mono text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Payment Status</Label>
                  <Select value={manualForm.payment_status} onValueChange={v => setManualForm({ ...manualForm, payment_status: v })}>
                    <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Installation Status</Label>
                  <Select value={manualForm.install_status} onValueChange={v => setManualForm({ ...manualForm, install_status: v })}>
                    <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pt-2 border-t border-border/30">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Delivery Address (optional)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input placeholder="House / Flat No." value={manualForm.address_houseNo} onChange={e => setManualForm({ ...manualForm, address_houseNo: e.target.value })} className="bg-muted/30 text-sm" />
                  <Input placeholder="Society / Area" value={manualForm.address_society} onChange={e => setManualForm({ ...manualForm, address_society: e.target.value })} className="bg-muted/30 text-sm" />
                  <Input placeholder="Landmark" value={manualForm.address_landmark} onChange={e => setManualForm({ ...manualForm, address_landmark: e.target.value })} className="bg-muted/30 text-sm" />
                  <Input placeholder="City" value={manualForm.address_city} onChange={e => setManualForm({ ...manualForm, address_city: e.target.value })} className="bg-muted/30 text-sm" />
                  <Input placeholder="State" value={manualForm.address_state} onChange={e => setManualForm({ ...manualForm, address_state: e.target.value })} className="bg-muted/30 text-sm" />
                  <Input placeholder="Pincode" value={manualForm.address_pincode} onChange={e => setManualForm({ ...manualForm, address_pincode: e.target.value })} className="bg-muted/30 text-sm" />
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Add Order</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Paid", value: stats.paid, color: "text-green-500" },
          { label: "Pending", value: stats.pending, color: "text-yellow-500" },
          { label: "Installed", value: stats.completed, color: "text-secondary" },
        ].map(s => (
          <div key={s.label} className="glass-card p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "All" },
          { value: "pending", label: "Pending" },
          { value: "paid", label: "Paid" },
          { value: "completed", label: "Installed" },
          { value: "scheduled", label: "Scheduled" },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.value ? "bg-primary/20 text-primary border border-primary/30" : "bg-muted/30 text-muted-foreground hover:text-foreground border border-transparent"}`}
            data-clickable
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">No orders found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => {
            const addr = order.delivery_address as any;
            const items = Array.isArray(order.items) ? order.items : [];
            const isExpanded = expandedOrder === order.id;
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="glass-card p-4 hover:border-primary/20 transition-colors">
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)} className="text-muted-foreground hover:text-foreground" data-clickable>
                      {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="font-semibold">{order.customer_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString("en-IN")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-bold text-primary">₹{Number(order.total_amount).toLocaleString("en-IN")}</div>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className={`text-[10px] ${paymentColors[order.payment_status] || ""}`}>{order.payment_status}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${installColors[order.install_status] || ""}`}>{order.install_status}</Badge>
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                {order.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Phone className="w-3 h-3" />{order.phone}</div>}
                {addr && <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2"><MapPin className="w-3 h-3 mt-0.5" /><span>{[addr.houseNo, addr.society, addr.area, addr.landmark, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}</span></div>}

                {/* Expanded: items + actions */}
                {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 pt-3 border-t border-border/30 space-y-3">
                    {/* Items */}
                    {items.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1"><Package className="w-3 h-3" /> Products</div>
                        <div className="space-y-1">
                          {items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm px-2 py-1 rounded bg-muted/20">
                              <span>{typeof item === "string" ? item : item.name || `Item ${idx + 1}`}</span>
                              {item.price && <span className="text-primary font-mono">₹{Number(item.price).toLocaleString("en-IN")}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status dropdowns */}
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <Select value={order.payment_status} onValueChange={v => updateStatus(order.id, "payment_status", v)}>
                          <SelectTrigger className="w-32 h-8 text-xs bg-muted/30"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-muted-foreground" />
                        <Select value={order.install_status} onValueChange={v => updateStatus(order.id, "install_status", v)}>
                          <SelectTrigger className="w-36 h-8 text-xs bg-muted/30"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="text-xs border-border/40" onClick={() => generateInvoice(order)}>
                        <FileText className="w-3 h-3 mr-1" /> Generate Invoice
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs border-border/40" onClick={() => window.open(`https://wa.me/${order.phone?.replace(/\D/g, "")}?text=Hi ${order.customer_name}, your order %23${order.id.slice(0, 8)} status: Payment ${order.payment_status}, Installation ${order.install_status}.`, "_blank")}>
                        <Phone className="w-3 h-3 mr-1" /> WhatsApp
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => deleteOrder(order.id)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
