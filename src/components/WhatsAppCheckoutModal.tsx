import { useState, useEffect } from "react";
import { Phone, User, CheckCircle2, Wallet, Banknote, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { AddressInput, type AddressData } from "@/components/AddressInput";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Props {
  product: any | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WhatsAppCheckoutModal = ({ product, open, onClose, onSuccess }: Props) => {
  const { user, profile } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState(""); 
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash_on_install"); 
  const [address, setAddress] = useState<AddressData>({
    pincode: "", city: "", state: "", houseNo: "", society: "", landmark: "", area: "",
  });

  useEffect(() => {
    if (open) {
      setIsSuccess(false);
      setGeneratedOrderId("");
    }
  }, [open]);

  useEffect(() => {
    if (profile && open && !isSuccess) {
      const nameParts = (profile.full_name || "").split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
      setPhone(profile.phone || "");
      if (profile.address) {
        try {
          const parsed = typeof profile.address === "string" ? JSON.parse(profile.address) : profile.address;
          setAddress({
            pincode: parsed.pincode || "", city: parsed.city || "", state: parsed.state || "",
            houseNo: parsed.houseNo || "", society: parsed.society || "", landmark: parsed.landmark || "",
            area: parsed.area || "", lat: parsed.lat, lng: parsed.lng,
          });
        } catch {
          setAddress(a => ({ ...a, society: profile.address || "" }));
        }
      }
    }
  }, [profile, open, isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setLoading(true);

    try {
      const orderData = {
        user_id: user?.id || null,
        customer_name: `${firstName} ${lastName}`.trim(),
        phone,
        delivery_address: JSON.stringify({
          pincode: address.pincode, city: address.city, state: address.state,
          houseNo: address.houseNo, society: address.society, landmark: address.landmark, area: address.area,
          lat: address.lat, lng: address.lng,
        }),
        // 🚀 SMART CHECK: Agar Cart se aaye hain toh real item array bhejenge
        items: JSON.stringify(product.rawItems || [{ id: product.id, name: product.name, price: product.price, qty: 1 }]),
        total_amount: product.price,
        whatsapp_sync: true,
        payment_method: paymentMethod, 
        payment_status: paymentMethod === "cash_on_install" ? "pending" : "pending",
        install_status: "pending",
        // 🚀 SMART CHECK: Catching Coupon Data
        applied_coupon_code: product.appliedCouponCode || null,
        discount_amount: product.discountAmount || 0,
      };

      let newOrderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);

      if (user) {
        const { data } = await supabase.from("orders").insert(orderData).select('id').single();
        if (data) newOrderId = data.id.slice(0, 8).toUpperCase();
      }
      
      setGeneratedOrderId(newOrderId);

      const fullAddress = [
        address.houseNo, address.society, address.area, 
        address.landmark, address.city, address.state, address.pincode
      ].filter(Boolean).join(', ');

      const paymentText = paymentMethod === "cash_on_install" ? "Cash/UPI on Installation" : "Online Payment (Pending)";
      const couponText = product.appliedCouponCode ? `\n*Coupon Applied:* ${product.appliedCouponCode}` : '';

      const msg = encodeURIComponent(
        `🟢 *Drishti Security - New Order*\n\n` +
        `*Order ID:* #${newOrderId}\n` +
        `*Product:* ${product.name}\n` +
        `*Amount Paid:* ₹${Number(product.price).toLocaleString()}` + 
        couponText + `\n` +
        `*Payment:* ${paymentText}\n\n` +
        `*Customer:* ${firstName} ${lastName}\n` +
        `*Phone:* ${phone}\n` +
        `*Address:* ${fullAddress}` +
        (address.lat ? `\n*Map Location:* https://maps.google.com/?q=${address.lat},${address.lng}` : '')
      );

      const targetNumber = (settings?.whatsapp_number || "919812366805").replace(/\D/g, ''); 
      window.open(`https://wa.me/${targetNumber}?text=${msg}`, "_blank");
      
      onSuccess?.();
      setIsSuccess(true); 
      
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = () => {
    onClose();
    if (user) navigate('/profile');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="glass-card border-border/40 max-w-md max-h-[90vh] overflow-y-auto p-0">
        <DialogDescription className="hidden">Enter details to confirm your order.</DialogDescription>
        
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl font-black tracking-tight">Complete Your Order</DialogTitle>
              </DialogHeader>
              
              {product && (
                <div className="mb-5 p-4 rounded-xl bg-primary/5 border border-primary/20 flex justify-between items-center">
                  <div className="font-bold text-sm text-foreground/80 line-clamp-1 pr-4">{product.name}</div>
                  <div className="text-primary font-black text-lg">₹{Number(product.price).toLocaleString()}</div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input required value={firstName} onChange={e => setFirstName(e.target.value)} className="pl-9 bg-muted/20 border-border/50 focus-visible:ring-primary/30" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Last Name</Label>
                    <Input required value={lastName} onChange={e => setLastName(e.target.value)} className="bg-muted/20 border-border/50 focus-visible:ring-primary/30" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input required value={phone} onChange={e => setPhone(e.target.value)} className="pl-9 bg-muted/20 border-border/50 focus-visible:ring-primary/30" placeholder="+91 98765 43210" />
                  </div>
                </div>

                <div className="pt-2">
                  <AddressInput value={address} onChange={setAddress} required />
                </div>

                <div className="pt-4 border-t border-border/30">
                  <Label className="text-xs font-black text-foreground uppercase tracking-widest mb-3 block">Payment Method</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      onClick={() => setPaymentMethod('cash_on_install')}
                      className={`cursor-pointer border p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cash_on_install' ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-border/50 hover:bg-muted/30 text-muted-foreground'}`}
                    >
                      <Banknote className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-center">Pay on Install<br/>(Cash/UPI)</span>
                    </div>
                    <div 
                      onClick={() => setPaymentMethod('online')}
                      className={`cursor-pointer border p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${paymentMethod === 'online' ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-border/50 hover:bg-muted/30 text-muted-foreground'}`}
                    >
                      <Wallet className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-center">Pay Now<br/>(Online)</span>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-lg shadow-primary/20 mt-2" disabled={loading}>
                  {loading ? "Processing..." : "Confirm Order via WhatsApp"}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              
              <h2 className="text-2xl font-black tracking-tight mb-2">Order Confirmed!</h2>
              <p className="text-muted-foreground text-sm mb-6">Your request has been successfully placed via WhatsApp.</p>
              
              <div className="w-full bg-muted/20 border border-border/50 rounded-2xl p-4 mb-8">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Order Tracking ID</div>
                <div className="text-xl font-mono font-black text-primary">#{generatedOrderId}</div>
              </div>

              <div className="w-full space-y-3 mb-8 text-left">
                <h3 className="text-xs font-black uppercase tracking-widest text-foreground/80 border-b border-border/50 pb-2">What happens next?</h3>
                <div className="flex gap-3 items-start text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                  <p className="text-muted-foreground">Our team will verify your WhatsApp details.</p>
                </div>
                <div className="flex gap-3 items-start text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                  <p className="text-muted-foreground">A technician will be assigned for {paymentMethod === 'cash_on_install' ? 'installation & payment' : 'installation'}.</p>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1 font-bold" onClick={onClose}>Close</Button>
                {user && (
                  <Button className="flex-1 font-bold flex items-center gap-2" onClick={handleTrackOrder}>
                    Track Order <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};