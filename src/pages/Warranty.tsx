import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Search, Calendar, Package, AlertCircle, CheckCircle2, XCircle, Clock, User, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Warranty = () => {
  const [serialNumber, setSerialNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const checkWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim()) {
      toast.error("Please enter a serial number.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data: orders, error } = await supabase.from("orders").select("*");
      if (error) throw error;

      let foundItem = null;
      let orderDetails = null;

      orders?.forEach((order) => {
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
        const item = items.find((i: any) => i.serial_number?.trim().toLowerCase() === serialNumber.trim().toLowerCase());
        if (item) { foundItem = item; orderDetails = order; }
      });

      if (foundItem && orderDetails) {
        const purchaseDate = new Date(orderDetails.created_at);
        const warrantyMonths = Number((foundItem as any).warranty_months) || 12;
        const expiryDate = new Date(purchaseDate);
        expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);
        const isExpired = new Date() > expiryDate;

        setResult({
          productName: (foundItem as any).name,
          customerName: orderDetails.customer_name,
          purchaseDate: purchaseDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
          expiryDate: expiryDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
          isExpired,
          serial: (foundItem as any).serial_number,
          orderId: orderDetails.id.slice(0, 8)
        });
        toast.success("Identity Verified Successfully!");
      } else {
        setResult("not_found");
        toast.error("Serial Number not found in our records.");
      }
    } catch (err) {
      toast.error("System synchronization error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid-bg pt-28 pb-12 px-4 flex flex-col items-center overflow-hidden relative">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-primary/5 blur-[120px] rounded-full -z-10" />

      <div className="w-full max-w-2xl space-y-12">
        {/* Professional Header Section */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 p-1 px-4 rounded-full bg-primary/10 text-primary border border-primary/20">
             <ShieldCheck className="w-3.5 h-3.5" />
             <span className="text-[10px] font-black tracking-[0.4em] uppercase">Security Asset Authentication</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight italic uppercase leading-none">
              Warranty <span className="text-primary">Verification</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">Validate the authenticity and active protection status of your hardware products.</p>
          </div>
        </motion.div>

        {/* Fixed Search Pill (No Border Overlap) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-orange-500/50 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <form onSubmit={checkWarranty} className="relative flex bg-card border border-primary/20 rounded-full p-1 shadow-2xl items-center">
            <div className="flex items-center flex-1 px-4">
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <Input 
                placeholder="Enter Serial Number (e.g. DSS-2026-XXXX)" 
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="bg-transparent border-none text-base focus-visible:ring-0 placeholder:text-muted-foreground/40 h-12 w-full"
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="h-11 px-8 rounded-full font-black uppercase italic tracking-wider transition-all shadow-lg active:scale-95"
            >
              {loading ? "Syncing..." : "Verify Identity"}
            </Button>
          </form>
        </motion.div>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {result === "not_found" && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="p-8 rounded-[2.5rem] border-2 border-destructive/20 bg-destructive/5 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
              <h3 className="text-xl font-black text-destructive uppercase">Unregistered Identity</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">This serial number could not be located in our secure database. Please verify the input or contact support.</p>
            </motion.div>
          )}

          {result && typeof result === 'object' && (
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border/40 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl relative"
            >
              {/* Product Header */}
              <div className={`p-5 flex items-center justify-between gap-4 border-b border-white/5 ${result.isExpired ? 'bg-destructive/10' : 'bg-emerald-500/10'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-primary/20 text-primary shrink-0">
                     <Package className="w-5 h-5" />
                  </div>
                  <span className="font-black uppercase italic text-sm tracking-widest truncate">{result.productName}</span>
                </div>
                <div className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 ${
                  result.isExpired ? 'bg-destructive text-white' : 'bg-emerald-500 text-white'
                }`}>
                  {result.isExpired ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {result.isExpired ? 'Protection Expired' : 'Active Coverage'}
                </div>
              </div>

              {/* Information Grid */}
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="p-3 rounded-2xl bg-muted/50 text-muted-foreground border border-border/40"><User className="w-5 h-5" /></div>
                     <div className="space-y-0.5">
                        <Label className="text-[10px] uppercase font-black opacity-40">Registered Owner</Label>
                        <p className="text-xl font-bold tracking-tight">{result.customerName}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="p-3 rounded-2xl bg-muted/50 text-muted-foreground border border-border/40"><Award className="w-5 h-5" /></div>
                     <div className="space-y-0.5">
                        <Label className="text-[10px] uppercase font-black opacity-40">Serial Identity S/N</Label>
                        <p className="text-sm font-mono font-bold bg-muted px-3 py-1.5 rounded-lg inline-block text-primary">{result.serial}</p>
                     </div>
                  </div>
                </div>

                <div className="space-y-6 md:border-l md:pl-8 border-border/40">
                  <div className="flex items-center gap-4">
                     <div className="p-3 rounded-2xl bg-muted/50 text-muted-foreground border border-border/40"><Clock className="w-5 h-5" /></div>
                     <div className="space-y-0.5">
                        <Label className="text-[10px] uppercase font-black opacity-40">Activation Date</Label>
                        <p className="text-lg font-bold text-muted-foreground">{result.purchaseDate}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="p-3 rounded-2xl bg-primary/20 text-primary border border-primary/20"><Calendar className="w-5 h-5" /></div>
                     <div className="space-y-0.5">
                        <Label className="text-[10px] uppercase font-black opacity-40">Coverage Valid Till</Label>
                        <p className={`text-xl font-black ${result.isExpired ? 'text-destructive' : 'text-emerald-600'}`}>
                           {result.expiryDate}
                        </p>
                     </div>
                  </div>
                </div>
              </div>

              {/* Reference Footer */}
              <div className="px-8 pb-8">
                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex flex-wrap justify-between items-center gap-4">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                     Reference: <span className="text-primary font-black">ORD-{result.orderId}</span>
                  </p>
                  <button onClick={() => window.location.href='/contact'} className="text-[10px] font-black uppercase text-primary underline underline-offset-4 decoration-2 hover:text-primary/80">Customer Support</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-[0.4em] opacity-30 pt-8">
          Official Drishti Security Authentication Cloud
        </p>
      </div>
    </div>
  );
};

export default Warranty;