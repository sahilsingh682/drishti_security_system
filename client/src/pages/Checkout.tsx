import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Phone, User, CheckCircle2, Wallet, Banknote, MessageCircle, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useCart } from "@/contexts/CartContext";
import { AddressInput, type AddressData } from "@/components/AddressInput";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// 🚀 NEW: Import the Soft Wall Modal
import CheckoutAuthModal from "@/components/CheckoutAuthModal";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Checkout() {
  const { user, profile } = useAuth();
  const { settings } = useSettings();
  const { clearCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  
  const product = location.state?.product;

  const [activeStep, setActiveStep] = useState("step-1");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState(""); 
  const [whatsappLink, setWhatsappLink] = useState(""); 
  
  // 🚀 NEW: Soft Wall States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [guestApproved, setGuestApproved] = useState(false);
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash_on_install"); 
  const [address, setAddress] = useState<AddressData>({
    pincode: "", city: "", state: "", houseNo: "", society: "", landmark: "", area: "",
  });

  useEffect(() => {
    if (!product) {
      toast.error("Your cart is empty or data is missing.");
      navigate("/cart");
    }
  }, [product, navigate]);

  // 🚀 NEW: The Interceptor Logic
  useEffect(() => {
    // If there is no user, they haven't explicitly clicked "continue as guest", and they haven't already paid... Pop the wall!
    if (!user && !guestApproved && !isSuccess && product) {
      setShowAuthModal(true);
    } else {
      setShowAuthModal(false);
    }
  }, [user, guestApproved, isSuccess, product]);

  useEffect(() => {
    if (profile && !isSuccess) {
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
  }, [profile, isSuccess]);

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
    localStorage.setItem('drishti_recent_order', orderId);
    localStorage.setItem('drishti_recent_phone', phone);
    setIsSuccess(true); 
    setLoading(false);
    clearCart(); 

    try {
      window.open(link, "_blank");
    } catch (e) {
      console.warn("Browser blocked the popup.");
    }
  };

  const handlePlaceOrder = async () => {
    if (!firstName || !phone || !address.pincode) {
      toast.error("Please fill in all required fields.");
      return;
    }

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
          toast.error("Payment cancelled or failed.");
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

  if (!product) return null;

  return (
    <div className="min-h-screen bg-muted/10 pt-24 pb-12 px-4">
      
      {/* 🚀 NEW: The Soft Wall Modal Component injected here */}
      <CheckoutAuthModal 
        isOpen={showAuthModal} 
        setIsOpen={setShowAuthModal} 
        proceedToGuestCheckout={() => {
          setShowAuthModal(false);
          setGuestApproved(true);
        }} 
      />

      <div className="container mx-auto max-w-4xl">
        
        {/* Secure Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/40">
          <h1 className="text-2xl font-black flex items-center gap-2">
            Secure Checkout <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </h1>
          <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Lock className="w-4 h-4" /> 100% Encrypted
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div key="checkout-flow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="grid md:grid-cols-[1fr_350px] gap-8">
              
              {/* LEFT COLUMN: The Accordion Form */}
              <div className="space-y-6">
                <Accordion type="single" value={activeStep} onValueChange={setActiveStep} className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
                  
                  {/* Step 1: Contact Details */}
                  <AccordionItem value="step-1" className="border-b-0">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === "step-1" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</div>
                        <span className="font-bold text-lg">Contact Details</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>First Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                            <Input required value={firstName} onChange={e => setFirstName(e.target.value)} className="pl-9" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Last Name</Label>
                          <Input required value={lastName} onChange={e => setLastName(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                          <Input required value={phone} onChange={e => setPhone(e.target.value)} className="pl-9" placeholder="+91 98765 43210" />
                        </div>
                      </div>
                      <Button onClick={() => setActiveStep("step-2")} className="w-full mt-2 font-bold">Continue to Address</Button>
                    </AccordionContent>
                  </AccordionItem>

                  <div className="h-px bg-border/40 w-full" />

                  {/* Step 2: Shipping Address */}
                  <AccordionItem value="step-2" className="border-b-0">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === "step-2" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</div>
                        <span className="font-bold text-lg">Installation Address</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                      <AddressInput value={address} onChange={setAddress} required />
                      <Button onClick={() => setActiveStep("step-3")} className="w-full mt-6 font-bold">Continue to Payment</Button>
                    </AccordionContent>
                  </AccordionItem>

                  <div className="h-px bg-border/40 w-full" />

                  {/* Step 3: Payment Method */}
                  <AccordionItem value="step-3" className="border-b-0">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activeStep === "step-3" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>3</div>
                        <span className="font-bold text-lg">Payment Method</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div 
                          onClick={() => setPaymentMethod('online')}
                          className={`cursor-pointer border-2 p-4 rounded-xl flex flex-col gap-2 transition-all ${paymentMethod === 'online' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 hover:bg-muted/30'}`}
                        >
                          <div className="flex justify-between items-start">
                            <Wallet className={`w-6 h-6 ${paymentMethod === 'online' ? 'text-primary' : 'text-muted-foreground'}`} />
                            {paymentMethod === 'online' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                          </div>
                          <div>
                            <div className="font-bold">Pay Securely Online</div>
                            <div className="text-xs text-muted-foreground">UPI, Cards, Netbanking</div>
                          </div>
                        </div>
                        
                        <div 
                          onClick={() => setPaymentMethod('cash_on_install')}
                          className={`cursor-pointer border-2 p-4 rounded-xl flex flex-col gap-2 transition-all ${paymentMethod === 'cash_on_install' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 hover:bg-muted/30'}`}
                        >
                           <div className="flex justify-between items-start">
                            <Banknote className={`w-6 h-6 ${paymentMethod === 'cash_on_install' ? 'text-primary' : 'text-muted-foreground'}`} />
                            {paymentMethod === 'cash_on_install' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                          </div>
                          <div>
                            <div className="font-bold">Pay on Installation</div>
                            <div className="text-xs text-muted-foreground">Cash or UPI after setup</div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* RIGHT COLUMN: Order Summary Box */}
              <div className="relative">
                <div className="sticky top-24 bg-card border border-border/40 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-black text-lg mb-4">Order Summary</h3>
                  
                  <div className="space-y-3 mb-6">
                    {product.rawItems?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate pr-4">{item.quantity}x {item.name}</span>
                        <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border/40 pt-4 space-y-2 mb-6">
                    {product.appliedCouponCode && (
                      <div className="flex justify-between text-sm text-emerald-500 font-medium">
                        <span>Discount ({product.appliedCouponCode})</span>
                        <span>- ₹{product.discountAmount?.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-black pt-2">
                      <span>Total</span>
                      <span className="text-primary">₹{Number(product.price).toLocaleString()}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handlePlaceOrder} 
                    className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-lg" 
                    disabled={loading || activeStep !== "step-3"}
                  >
                    {loading ? "Processing..." : (paymentMethod === 'online' ? "Pay & Place Order" : "Confirm Order")}
                  </Button>
                  {activeStep !== "step-3" && (
                    <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      Complete all steps above to place order
                    </p>
                  )}

                  <p className="text-center text-[10px] text-muted-foreground mt-4 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" /> Payments processed securely by Razorpay
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            
            // THE SUCCESS SCREEN
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto bg-card border border-border/40 rounded-2xl p-8 md:p-12 text-center shadow-sm">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              
              <h2 className="text-3xl font-black tracking-tight mb-3">Order Placed Successfully!</h2>
              <p className="text-muted-foreground mb-8">Thank you for securing your property with Drishti. Your request has been logged.</p>
              
              <div className="bg-muted/20 border border-border/50 rounded-xl p-6 mb-8 max-w-sm mx-auto">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Tracking ID</div>
                <div className="text-2xl font-mono font-black text-primary">#{generatedOrderId}</div>
              </div>

              <Button 
                onClick={() => window.open(whatsappLink, "_blank")}
                className="h-14 px-8 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold mb-8 shadow-lg shadow-[#25D366]/20"
              >
                <MessageCircle className="w-5 h-5 mr-2" /> Open WhatsApp Receipt
              </Button>

              <div className="flex gap-4 justify-center">
                <Link to="/store">
                  <Button variant="outline" className="font-bold">Continue Shopping</Button>
                </Link>
                {user ? (
                  <Link to="/profile">
                    <Button className="font-bold flex items-center gap-2">
                      Track Order <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                ) : (
                  // 🚀 NEW: Link guests to the TrackOrder page they built!
                  <Link to="/track-order">
                    <Button className="font-bold flex items-center gap-2">
                      Track as Guest <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}