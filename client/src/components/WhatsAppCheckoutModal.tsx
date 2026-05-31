import { useState, useEffect } from "react";
import { Phone, User, CheckCircle2, Wallet, Banknote, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { AddressInput, type AddressData } from "@/components/AddressInput";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// 🚀 Restored Razorpay Script Loader
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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
  const [whatsappLink, setWhatsappLink] = useState(""); // Backup link if popup blocked
  
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
      setWhatsappLink("");
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

  // 🚀 The Bulletproof Success Handler
  const triggerSuccessAndWhatsApp = (orderId: string, finalTotal: number, paymentText: string) => {
    const fullAddress = [
      address.houseNo, address.society, address.area, 
      address.landmark, address.city, address.state, address.pincode
    ].filter(Boolean).join(', ');

    const productName = product?.name || "Drishti Security Equipment";
    const couponText = product?.appliedCouponCode ? `\n*Coupon Applied:* ${product.appliedCouponCode}` : '';

    const msg = encodeURIComponent(
      `🟢 *Drishti Security - New Order*\n\n` +
      `*Order ID:* #${orderId}\n` +
      `*Product:* ${productName}\n` +
      `*Amount Paid:* ₹${Number(finalTotal).toLocaleString()}` + 
      couponText + `\n` +
      `*Payment:* ${paymentText}\n\n` +
      `*Customer:* ${firstName} ${lastName}\n` +
      `*Phone:* ${phone}\n` +
      `*Address:* ${fullAddress}` +
      (address.lat ? `\n*Map Location:* https://maps.google.com/?q=$${address.lat},${address.lng}` : '')
    );

    const targetNumber = (settings?.whatsapp|| "919812019772").replace(/\D/g, ''); 
    const link = `https://wa.me/${targetNumber}?text=${msg}`;
    
    setWhatsappLink(link);
    setGeneratedOrderId(orderId);
    
    // 1. SHOW SUCCESS SCREEN IMMEDIATELY (Prevents Panic)
    setIsSuccess(true); 
    setLoading(false);
    onSuccess?.(); // Clear the cart safely

    // 2. Safely attempt to open WhatsApp
    try {
      window.open(link, "_blank");
    } catch (e) {
      console.warn("Browser blocked the popup. Customer can use the manual button.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setLoading(true);

    try {
      const orderItems = product.rawItems || [{ id: product.id, name: product.name, qty: 1 }];
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_URL}/api/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          totalAmount: product.price,
          customerDetails: {
            name: `${firstName} ${lastName}`.trim(),
            phone: phone,
            address: address, 
            userId: user?.id || null,
            paymentMethod: paymentMethod,
            couponCode: product.appliedCouponCode || null
          }
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Checkout failed');

      const newOrderId = data.orderId;
      const secureTotal = data.totalAmount;

      // 🚀 RESTORED RAZORPAY LOGIC
      if (paymentMethod === 'online' && data.razorpayOrderId) {
        const res = await loadRazorpayScript();
        if (!res) {
          toast.error("Razorpay SDK failed to load. Are you online?");
          setLoading(false);
          return;
        }

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
          amount: Math.round(secureTotal * 100), 
          currency: "INR",
          name: "Drishti Security System",
          description: "Secure Checkout",
          order_id: data.razorpayOrderId,
          handler: async function (rzpResponse: any) {
            const verifyRes = await fetch(`${API_URL}/api/orders/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: rzpResponse.razorpay_order_id,
                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                razorpay_signature: rzpResponse.razorpay_signature,
                orderId: newOrderId
              })
            });
            
            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              triggerSuccessAndWhatsApp(newOrderId, secureTotal, "Online Payment (Paid Successfully) ✅");
            } else {
              toast.error("Payment verification failed! Please contact support.");
              setLoading(false);
            }
          },
          prefill: { name: `${firstName} ${lastName}`.trim(), contact: phone },
          theme: { color: "#0f172a" },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.on('payment.failed', function () {
          toast.error("Payment cancelled or failed. Please try again.");
          setLoading(false);
        });
        paymentObject.open();

      } else {
        triggerSuccessAndWhatsApp(newOrderId, secureTotal, "Cash/UPI on Installation");
      }
      
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error("Something went wrong during checkout.");
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
                  {loading ? "Processing..." : (paymentMethod === 'online' ? "Pay Securely" : "Confirm Order via WhatsApp")}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              
              <h2 className="text-2xl font-black tracking-tight mb-2">Order Confirmed!</h2>
              <p className="text-muted-foreground text-sm mb-6">Your payment was successful and your request has been placed.</p>
              
              <div className="w-full bg-muted/20 border border-border/50 rounded-2xl p-4 mb-6">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Order Tracking ID</div>
                <div className="text-xl font-mono font-black text-primary">#{generatedOrderId}</div>
              </div>

              {/* 🚀 BACKUP WHATSAPP BUTTON IF BROWSER BLOCKED THE POPUP */}
              <Button 
                onClick={() => window.open(whatsappLink, "_blank")}
                className="w-full h-12 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold mb-8 shadow-lg shadow-[#25D366]/20"
              >
                <MessageCircle className="w-5 h-5 mr-2" /> Send WhatsApp Receipt
              </Button>

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