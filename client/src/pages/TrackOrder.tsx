import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Clock, MapPin, Calendar, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";

const STEPS = ["pending", "scheduled", "in_progress", "completed"];

const parseItemsRobust = (itemsData: any) => {
  if (!itemsData) return [];
  try {
    const arr = typeof itemsData === "string" ? JSON.parse(itemsData) : itemsData;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const parseAddress = (addr: any): string => {
  if (!addr) return "—";
  try {
    const a = typeof addr === "string" ? JSON.parse(addr) : addr;
    return [a.houseNo, a.society, a.area, a.landmark, a.city, a.state, a.pincode].filter(Boolean).join(", ");
  } catch {
    return String(addr);
  }
};

export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !phone) {
      toast.error("Please enter both Order ID and Phone Number");
      return;
    }

    setLoading(true);
    setOrder(null);
    try {
      // Clean ID by removing '#' if user typed it
      const cleanId = orderId.replace('#', '').trim();
      
      // 🚀 Calling our Secure RPC Function
      const { data, error } = await supabase.rpc('track_guest_order', {
        p_order_id: cleanId,
        p_phone: phone.trim()
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setOrder(data[0]);
        toast.success("Order found!");
      } else {
        toast.error("No order found with these details. Please check and try again.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to track order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background/50 pt-24 pb-12 px-4 md:px-6">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-6"><BackButton /></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Search className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase italic">Track Your Order</h1>
          <p className="text-muted-foreground mt-2 font-medium">Enter your details below to see real-time installation status.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 md:p-8 rounded-3xl border border-primary/20 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
          
          <form onSubmit={handleTrack} className="space-y-5 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Order ID</Label>
                <div className="relative">
                  <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                  <Input 
                    placeholder="e.g. 8818A7C0" 
                    value={orderId} 
                    onChange={e => setOrderId(e.target.value)} 
                    className="pl-10 h-14 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-primary/40 font-mono font-bold uppercase" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                  <Input 
                    placeholder="e.g. 98120XXXXX" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    className="pl-10 h-14 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-primary/40 font-bold" 
                    required 
                  />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-lg shadow-primary/20 text-sm transition-all" disabled={loading}>
              {loading ? "Searching..." : "Track Now"}
            </Button>
          </form>
        </motion.div>

        <AnimatePresence>
          {order && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="glass-card p-6 md:p-8 rounded-3xl border border-orange-500/30 bg-orange-500/5 shadow-lg shadow-orange-500/10 mb-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="font-black text-xl text-orange-600 dark:text-orange-400">Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
                      Placed on: {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="bg-orange-500 text-white text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest shadow-sm">
                    {order.install_status.replace('_', ' ')}
                  </span>
                </div>

                {/* Live Progress Bar */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    {STEPS.map((step, idx) => {
                      const currentIdx = STEPS.indexOf(order.install_status);
                      const isActive = idx <= currentIdx;
                      return (
                        <div key={step} className="flex-1">
                          <div className={`h-2.5 rounded-full transition-all duration-700 ${isActive ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.6)]" : "bg-orange-500/20"}`} />
                          <div className={`text-[9px] font-black uppercase tracking-widest mt-2 text-center ${isActive ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground/50"}`}>
                            {step.replace('_', ' ')}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-background/60 rounded-2xl p-5 border border-border/50 space-y-4">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm font-bold leading-relaxed">
                      {parseItemsRobust(order.items).map((item: any) => item.name.replace(/\[Applied Coupon:.*?\]/g, '').trim()).join(", ")}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm font-medium text-muted-foreground leading-relaxed">
                      {parseAddress(order.delivery_address)}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm font-black text-foreground">
                      Total Amount: ₹{Number(order.total_amount).toLocaleString()}
                      <span className="text-[10px] ml-2 px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">
                        {order.payment_status}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}