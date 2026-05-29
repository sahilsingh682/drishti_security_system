import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, Phone, MapPin, Wrench, Package, 
  CreditCard, ShieldCheck, Search, ChevronDown, ChevronUp, 
  PlayCircle, CheckCircle2, Calendar, XCircle, User,
  ClipboardList, FileText, Printer, ArrowLeft, Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";

const parseAddress = (addr: any): string => {
  if (!addr) return "—";
  try {
    const a = typeof addr === "string" ? JSON.parse(addr) : addr;
    return [a.houseNo, a.society, a.landmark, a.area, a.city, a.state, a.pincode].filter(Boolean).join(", ");
  } catch {
    return String(addr);
  }
};

export default function AdminOrders() {
  const { settings } = useSettings(); 
  const [orders, setOrders] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customWarrantyFields, setCustomWarrantyFields] = useState<Record<string, boolean>>({});
  
  const [invoiceOrder, setInvoiceOrder] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: ordersData } = await supabase
        .from("orders")
        .select(`*, assigned_technician:staff(name)`)
        .order("created_at", { ascending: false });
      const { data: staffData } = await supabase.from("staff").select("*").eq("is_active", true);
      setOrders(ordersData || []);
      setStaff(staffData || []);
    } catch (err: any) {
      toast.error("Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const updateOrder = async (orderId: string, updates: any) => {
    if (updates.installation_type === 'self') {
      updates.assigned_technician_id = null;
    }
    const { error } = await supabase.from("orders").update(updates).eq("id", orderId);
    if (!error) {
      toast.success("System Updated Successfully");
      fetchData();
    }
  };

  const updateItemData = (order: any, itemIdx: number, field: string, value: any) => {
    let items = [...(typeof order.items === 'string' ? JSON.parse(order.items) : order.items)];
    items[itemIdx] = { ...items[itemIdx], [field]: value };
    updateOrder(order.id, { items: items });
  };

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  const filteredOrders = orders.filter(order => 
    (order.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.id.includes(searchTerm)
  );

  // 🖨️ INVOICE RENDERER
  if (invoiceOrder) {
    let invoiceItems = [];
    try { invoiceItems = typeof invoiceOrder.items === 'string' ? JSON.parse(invoiceOrder.items) : (invoiceOrder.items || []); } catch (e) { invoiceItems = []; }
    
    const subtotal = invoiceItems.reduce((sum: number, item: any) => sum + ((parseFloat(item.price) || 0) * (item.quantity || item.qty || 1)), 0);
    const grandTotal = Number(invoiceOrder.total_amount) || 0;
    
    const discountAmount = Number(invoiceOrder.discount_amount) || (subtotal > grandTotal ? subtotal - grandTotal : 0);
    const hasDiscount = discountAmount > 0;

    const baseAmount = grandTotal / 1.18; 
    const totalGst = grandTotal - baseAmount;
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;

    const displayPhone = settings?.whatsapp_number || "919812366805";

    return (
      <div className="fixed inset-0 z-50 bg-white overflow-auto print:p-0 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden bg-muted/50 p-4 rounded-2xl border border-border/50">
           <Button variant="outline" onClick={() => setInvoiceOrder(null)} className="rounded-full font-bold">
             <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
           </Button>
           <Button onClick={() => window.print()} className="rounded-full font-black bg-primary px-8 shadow-lg hover:scale-105 transition-all">
             <Printer className="w-4 h-4 mr-2" /> Save as PDF / Print
           </Button>
        </div>

        <div className="max-w-4xl mx-auto bg-white text-black p-8 sm:p-12 border border-gray-200 shadow-2xl print:shadow-none print:border-none rounded-xl print:rounded-none">
           <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8">
              <div>
                 <h1 className="text-4xl font-black text-orange-600 tracking-tighter uppercase italic leading-none">Drishti</h1>
                 <p className="text-lg font-black tracking-widest text-gray-800 mt-1 uppercase">Security System</p>
                 <div className="mt-4 text-xs font-medium text-gray-500 space-y-1">
                    <p>Panipat, Haryana, India</p>
                    <p>Phone: +{displayPhone}</p>
                    <p>Email: {settings?.business_email || "support@drishtisecurity.com"}</p>
                    <p className="font-bold text-gray-800 pt-1">GSTIN: 06DRISH715E1Z5</p>
                 </div>
              </div>
              <div className="text-right">
                 <h2 className="text-4xl font-black text-gray-200 uppercase tracking-widest">Tax Invoice</h2>
                 <p className="text-sm font-bold text-gray-800 mt-2">INV-{invoiceOrder.id.slice(0, 8).toUpperCase()}</p>
                 <p className="text-xs font-semibold text-gray-500 mt-1">Date: {new Date(invoiceOrder.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                 <div className="mt-4 inline-block px-3 py-1 bg-gray-100 rounded text-xs font-black text-gray-600 uppercase">
                    Status: {invoiceOrder.payment_status === 'paid' ? 'PAID / COMPLETED' : 'PAYMENT PENDING'}
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                 <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Billed To:</p>
                 <h3 className="text-lg font-black text-gray-800">{invoiceOrder.customer_name}</h3>
                 <p className="text-sm font-medium text-gray-600 mt-1">{invoiceOrder.phone}</p>
                 <p className="text-xs font-medium text-gray-500 mt-1 max-w-[250px] leading-relaxed">{parseAddress(invoiceOrder.delivery_address)}</p>
                 <p className="text-xs font-bold text-gray-600 mt-2">State: Haryana (06)</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Installation Mode:</p>
                 <p className="text-sm font-bold text-gray-800 uppercase">{invoiceOrder.installation_type === 'technician' ? 'Drishti Expert Team' : 'Customer Self Installation'}</p>
                 {invoiceOrder.payment_method && invoiceOrder.payment_status === 'paid' && (
                   <>
                     <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-4 mb-1">Payment Method:</p>
                     <p className="text-sm font-bold text-gray-800 uppercase">{invoiceOrder.payment_method}</p>
                   </>
                 )}
              </div>
           </div>

           <table className="w-full text-left mb-8 border-collapse">
              <thead>
                 <tr className="bg-gray-100 text-gray-800 text-[10px] uppercase font-black tracking-widest">
                    <th className="py-3 px-4 rounded-l-lg">Description & Serial No.</th>
                    <th className="py-3 px-4 text-center">Warranty</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right rounded-r-lg">Total</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {invoiceItems.map((item: any, idx: number) => {
                    const price = parseFloat(item.price) || 0;
                    const qty = item.quantity || item.qty || 1;
                    const total = price * qty;
                    const cleanName = item.name.replace(/\[Applied Coupon:.*?\]/g, '').trim();
                    return (
                      <tr key={idx} className="text-sm font-medium text-gray-700">
                         <td className="py-4 px-4">
                            <p className="font-bold text-gray-900">{cleanName}</p>
                            {item.serial_number && <p className="text-[10px] font-mono text-gray-500 mt-1">S/N: {item.serial_number}</p>}
                         </td>
                         <td className="py-4 px-4 text-center text-xs">{item.warranty_months ? `${item.warranty_months} Months` : 'N/A'}</td>
                         <td className="py-4 px-4 text-center font-bold">{qty}</td>
                         <td className="py-4 px-4 text-right">₹{price.toLocaleString('en-IN')}</td>
                         <td className="py-4 px-4 text-right font-black text-gray-900">₹{total.toLocaleString('en-IN')}</td>
                      </tr>
                    )
                 })}
              </tbody>
           </table>

           <div className="flex justify-end border-t-2 border-gray-800 pt-6 mb-12">
              <div className="w-80 space-y-3">
                 <div className="flex justify-between text-sm font-bold text-gray-600">
                    <span>Subtotal (Items):</span>
                    <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                 </div>
                 
                 {hasDiscount && (
                   <div className="flex justify-between text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 -mx-2 rounded">
                     <span>Discount Applied {invoiceOrder.applied_coupon_code ? `(${invoiceOrder.applied_coupon_code})` : ''}:</span>
                     <span>- ₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                   </div>
                 )}

                 <div className="flex justify-between text-sm font-bold text-gray-600 pt-2 border-t border-gray-100 mt-2">
                    {/* 🚀 FIXED: Dynamic Taxable Value Label */}
                    <span>Taxable Value {hasDiscount ? '(Post Discount)' : ''}:</span>
                    <span>₹{baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                 </div>
                 <div className="flex justify-between text-sm font-bold text-gray-600">
                    <span>CGST @ 9%:</span>
                    <span>₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                 </div>
                 <div className="flex justify-between text-sm font-bold text-gray-600">
                    <span>SGST @ 9%:</span>
                    <span>₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                 </div>
                 <div className="flex justify-between text-xl font-black text-orange-600 pt-4 border-t border-gray-200 mt-2">
                    <span>Grand Total:</span>
                    <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                 </div>
              </div>
           </div>

           <div className="text-[10px] font-medium text-gray-400 leading-relaxed border-t border-gray-100 pt-6">
              <p className="font-bold text-gray-600 mb-1">Terms & Conditions:</p>
              <p>1. Warranty is strictly applicable against manufacturing defects only as per the specified months. Physical damage, burns, or electrical surges are not covered.</p>
              <p>2. Please retain this tax invoice and product serial numbers for any warranty claims. You can verify your warranty status 24/7 on our official website.</p>
              <p>3. Tax is calculated on the final discounted value as per government regulations.</p>
              <p className="mt-6 text-center font-black tracking-widest uppercase text-gray-300">Thank you for choosing Drishti Security</p>
           </div>
        </div>
      </div>
    );
  }

  // 💻 MAIN ADMIN DASHBOARD UI
  if (loading) return <div className="p-20 text-center font-black text-primary animate-pulse tracking-widest uppercase">Syncing Dashboard...</div>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto px-2 pb-24 pt-4 print:hidden">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md pb-4 pt-2 border-b flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search Customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-11 rounded-xl bg-card border-primary/20" />
        </div>
      </div>

      <div className="space-y-3">
        {filteredOrders.map((order) => {
          const isExp = expandedId === order.id;
          const isPaid = order.payment_status === 'paid';
          const isTechRequired = (order.installation_type || 'technician') === 'technician';
          let items = [];
          try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch (e) { items = []; }

          return (
            <motion.div layout key={order.id} className={`group border rounded-2xl transition-all overflow-hidden bg-card/50 ${isExp ? 'border-primary ring-2 ring-primary/5 shadow-xl' : 'border-border/40'}`}>
              
              <div onClick={() => toggleExpand(order.id)} className="p-3 md:p-4 cursor-pointer flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${isPaid ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                    {order.customer_name?.charAt(0)}
                  </div>
                  <div className="truncate">
                    <h3 className="font-bold text-sm md:text-base truncate leading-tight">{order.customer_name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[10px] font-mono font-bold opacity-40">#{order.id.slice(0, 8).toUpperCase()}</span>
                       <span className="text-[9px] bg-primary/5 text-primary px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">{order.install_status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-black text-primary">₹{Number(order.total_amount || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[9px] font-bold opacity-40 uppercase">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className={`p-1.5 rounded-full transition-colors ${isExp ? 'bg-primary text-white' : 'bg-muted opacity-40'}`}>
                    {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isExp && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border/20 bg-primary/[0.01]">
                    <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      <div className="lg:col-span-3 space-y-5">
                        <div className="space-y-4">
                           <div className="space-y-1">
                              <Label className="text-[9px] uppercase font-black opacity-40 flex items-center gap-1.5"><Phone className="w-3 h-3" /> Contact</Label>
                              <a href={`tel:${order.phone}`} className="text-sm font-black block text-primary">{order.phone}</a>
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[9px] uppercase font-black opacity-40">Payment</Label>
                              <div className="flex flex-col gap-2">
                                {/* 🚀 FIXED BUG 1: Dropdown mein ab 'pending' match ho jayega */}
                                <Select value={order.payment_status || 'pending'} onValueChange={(val) => updateOrder(order.id, { payment_status: val })}>
                                  <SelectTrigger className={`h-9 text-[10px] font-bold ${isPaid ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-orange-500/10 text-orange-600 border-orange-500/20'}`}><SelectValue /></SelectTrigger>
                                  <SelectContent><SelectItem value="pending">PENDING</SelectItem><SelectItem value="paid">PAID ✅</SelectItem><SelectItem value="failed">FAILED ❌</SelectItem></SelectContent>
                                </Select>
                                {isPaid && (
                                  <Select value={order.payment_method || 'cash'} onValueChange={(val) => updateOrder(order.id, { payment_method: val })}>
                                    <SelectTrigger className="h-9 text-[10px] font-bold bg-background border-border/40"><SelectValue placeholder="Method" /></SelectTrigger>
                                    <SelectContent><SelectItem value="cash">💵 CASH</SelectItem><SelectItem value="upi">📱 UPI</SelectItem><SelectItem value="bank">🏦 BANK</SelectItem></SelectContent>
                                  </Select>
                                )}
                              </div>
                           </div>
                           <div className="space-y-1">
                            <Label className="text-[9px] uppercase font-black opacity-40">Installation</Label>
                            <Select value={order.installation_type || 'technician'} onValueChange={(val) => updateOrder(order.id, { installation_type: val })}>
                              <SelectTrigger className="h-9 text-[10px] font-bold bg-background"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="technician">👷 TECH TEAM</SelectItem><SelectItem value="self">🏠 SELF INSTALL</SelectItem></SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/20 border border-border/10">
                          <Label className="text-[9px] uppercase font-black opacity-40 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Address</Label>
                          <p className="text-[11px] font-bold leading-relaxed text-muted-foreground mt-1">{parseAddress(order.delivery_address)}</p>
                        </div>
                      </div>

                      <div className="lg:col-span-5 space-y-3">
                        <Label className="text-[9px] uppercase font-black text-primary flex items-center gap-2"><Package className="w-4 h-4" /> Item Inventory</Label>
                        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                          {items.map((item: any, idx: number) => {
                            const fieldKey = `${order.id}-${idx}`;
                            const isCustom = customWarrantyFields[fieldKey];
                            const itemPrice = parseFloat(item.price) || 0;
                            const qty = item.quantity || item.qty || 1;
                            const itemTotal = itemPrice * qty;
                            
                            return (
                              <div key={idx} className="bg-background/80 p-3 rounded-xl border border-border/40 space-y-2 shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs font-bold truncate pr-2">{item.name.replace(/\[Applied Coupon:.*?\]/g, '').trim()}</span>
                                  <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded">x{qty} - ₹{itemTotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                  {/* 🚀 FIXED BUG 2: Multi-qty ke liye lamba dabba aur better hint */}
                                  <Input 
                                    placeholder={qty > 1 ? "Enter multiple Serial Nos (comma separated)..." : "Serial No."} 
                                    defaultValue={item.serial_number} 
                                    className="h-8 text-[10px] font-mono bg-muted/20 border-border/40 flex-1" 
                                    onBlur={(e) => updateItemData(order, idx, 'serial_number', e.target.value)} 
                                  />
                                  {!isCustom ? (
                                    <Select value={String(item.warranty_months || 12)} onValueChange={(val) => val === "custom" ? setCustomWarrantyFields({...customWarrantyFields, [fieldKey]: true}) : updateItemData(order, idx, 'warranty_months', parseInt(val))}>
                                      <SelectTrigger className="h-8 w-20 text-[10px] font-bold border-none bg-muted/20 shrink-0"><SelectValue /></SelectTrigger>
                                      <SelectContent><SelectItem value="6">6M</SelectItem><SelectItem value="12">1Y</SelectItem><SelectItem value="24">2Y</SelectItem><SelectItem value="custom">✏️ Custom</SelectItem></SelectContent>
                                    </Select>
                                  ) : (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Input type="number" placeholder="Months" className="h-8 w-16 text-[10px]" autoFocus onBlur={(e) => {
                                        updateItemData(order, idx, 'warranty_months', parseInt(e.target.value));
                                        setCustomWarrantyFields({...customWarrantyFields, [fieldKey]: false});
                                      }} />
                                      <XCircle className="w-3.5 h-3.5 text-destructive cursor-pointer" onClick={() => setCustomWarrantyFields({...customWarrantyFields, [fieldKey]: false})} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="lg:col-span-4 space-y-5 border-t lg:border-t-0 lg:border-l border-border/20 pt-5 lg:pt-0 lg:pl-6 relative">
                        {isTechRequired ? (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <Label className="text-[9px] uppercase font-black text-primary flex items-center gap-1.5"><User className="w-3 h-3" /> Assign Expert</Label>
                              <Select value={order.assigned_technician_id || "none"} onValueChange={(val) => updateOrder(order.id, { assigned_technician_id: val === "none" ? null : val })}>
                                <SelectTrigger className="h-10 text-[11px] font-bold"><SelectValue placeholder="Staff..." /></SelectTrigger>
                                <SelectContent><SelectItem value="none">UNASSIGNED</SelectItem>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[9px] uppercase font-black opacity-40 flex items-center gap-1.5"><ClipboardList className="w-3 h-3" /> Progress Logs</Label>
                              <textarea className="w-full h-16 bg-muted/20 rounded-xl p-2.5 text-[11px] font-medium resize-none border-none outline-none focus:ring-1 focus:ring-primary/20" placeholder="Type logs..." defaultValue={order.technician_notes} onBlur={(e) => updateOrder(order.id, { technician_notes: e.target.value })} />
                            </div>
                          </div>
                        ) : (
                          <div className="h-32 flex flex-col items-center justify-center border border-dashed rounded-2xl bg-muted/5">
                             <p className="text-[10px] font-black uppercase tracking-widest text-center">Self Installation<br/>No Team Required</p>
                          </div>
                        )}

                        {/* 🚀 FIXED BUG 3: Self Install ke buttons Dispatch/Delivered ho gaye */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <Button onClick={() => updateOrder(order.id, { install_status: 'in_progress' })} className={`h-11 rounded-xl text-xs font-black shadow-lg ${order.install_status === 'in_progress' ? 'bg-primary' : 'bg-muted text-foreground'}`}>
                            {isTechRequired ? <><PlayCircle className="w-4 h-4 mr-2" /> START</> : <><Truck className="w-4 h-4 mr-2" /> DISPATCH</>}
                          </Button>
                          <Button onClick={() => updateOrder(order.id, { install_status: 'completed' })} className={`h-11 rounded-xl text-xs font-black shadow-lg ${order.install_status === 'completed' ? 'bg-green-600' : 'bg-muted text-foreground'}`}>
                            <CheckCircle2 className="w-4 h-4 mr-2" /> {isTechRequired ? 'DONE' : 'DELIVERED'}
                          </Button>
                        </div>
                        
                        <Button 
                          onClick={() => setInvoiceOrder(order)} 
                          variant="outline"
                          className="w-full h-11 rounded-xl text-xs font-black border-primary/20 hover:bg-primary/5 text-primary"
                        >
                          <FileText className="w-4 h-4 mr-2" /> GENERATE TAX INVOICE
                        </Button>
                      </div>
                    </div>

                    <div className="bg-primary/5 px-6 py-2 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-primary/60 italic border-t border-border/10">
                       <span>{isTechRequired ? `Expert: ${order.assigned_technician?.name || 'Awaiting'}` : 'Mode: Customer Self Install'}</span>
                       <span>Current State: {order.install_status}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}