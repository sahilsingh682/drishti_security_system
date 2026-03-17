import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Camera, Check, ArrowRight, ArrowLeft, ShoppingBag, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";

const KitBuilder = () => {
  const [step, setStep] = useState(0);
  const [dvrs, setDvrs] = useState<any[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedDvr, setSelectedDvr] = useState<any | null>(null);
  const [selectedCams, setSelectedCams] = useState<{ cam: any; qty: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase.from("kit_items").select("*").eq("is_active", true).order("price", { ascending: true });
      if (data) {
        setDvrs(data.filter(i => i.type === 'dvr'));
        setCameras(data.filter(i => i.type === 'camera'));
      }
      setLoading(false);
    };
    fetchItems();
  }, []);

  const toggleCam = (cam: any) => {
    setSelectedCams(prev => {
      const existing = prev.find(c => c.cam.id === cam.id);
      if (existing) return prev.filter(c => c.cam.id !== cam.id);
      return [...prev, { cam, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setSelectedCams(prev => prev.map(c => c.cam.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  };

  const total = (selectedDvr?.price || 0) + selectedCams.reduce((s, c) => s + c.cam.price * c.qty, 0);

  const orderViaWhatsApp = () => {
  const whatsappNumber = settings?.whatsapp || "919876543210"; // Dynamic number
  let msg = `🛠️ *NEW CUSTOM KIT ORDER*\n\n*DVR/NVR:*\n1x ${selectedDvr?.name} - ₹${selectedDvr?.price}\n\n*Cameras:*\n`;
  selectedCams.forEach(c => { msg += `${c.qty}x ${c.cam.name} - ₹${c.cam.price * c.qty}\n`; });
  msg += `\n*Hardware Total: ₹${total.toLocaleString("en-IN")}*\n\n_Note: I understand that installation and wiring charges are extra and will be discussed on-site._\n\nPlease contact me to schedule the installation.`;

  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
  };
  

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="min-h-screen bg-background grid-bg pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <span className="text-xs font-mono tracking-[0.3em] text-primary uppercase">Build Your System</span>
          <h1 className="text-3xl font-bold mt-3">Kit <span className="text-gradient-amber">Builder</span></h1>
        </motion.div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["DVR", "Cameras", "Review"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${i <= step ? "bg-primary/20 border-primary/40 text-primary" : "border-border/40 text-muted-foreground"}`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${i <= step ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
              {i < 2 && <div className={`w-8 h-px ${i < step ? "bg-primary/40" : "bg-border/40"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="dvr" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Monitor className="w-5 h-5 text-secondary" /> Choose DVR/NVR</h2>
              {dvrs.map(dvr => (
                <button key={dvr.id} data-clickable onClick={() => setSelectedDvr(dvr)} className={`w-full glass-card p-4 flex items-center justify-between transition-all text-left ${selectedDvr?.id === dvr.id ? "neon-border-amber" : "hover:border-primary/20"}`}>
                  <span className="font-medium">{dvr.name}</span>
                  <span className="text-primary font-bold">₹{dvr.price.toLocaleString("en-IN")}</span>
                </button>
              ))}
              <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!selectedDvr} onClick={() => setStep(1)}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="cams" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Camera className="w-5 h-5 text-secondary" /> Choose Cameras</h2>
              {cameras.map(cam => {
                const sel = selectedCams.find(c => c.cam.id === cam.id);
                return (
                  <div key={cam.id} className={`glass-card p-4 flex items-center justify-between ${sel ? "neon-border-amber" : ""}`}>
                    <button data-clickable onClick={() => toggleCam(cam)} className="flex-1 text-left">
                      <span className="font-medium">{cam.name}</span>
                      <span className="text-primary font-bold ml-3">₹{cam.price.toLocaleString("en-IN")}</span>
                    </button>
                    {sel && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => updateQty(cam.id, -1)} className="h-7 w-7 p-0">-</Button>
                        <span className="text-sm font-mono w-6 text-center">{sel.qty}</span>
                        <Button size="sm" variant="ghost" onClick={() => updateQty(cam.id, 1)} className="h-7 w-7 p-0">+</Button>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(0)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={selectedCams.length === 0} onClick={() => setStep(2)}>
                  Review <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="review" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-secondary" /> Review Kit</h2>
              <div className="glass-card p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>{selectedDvr?.name}</span>
                  <span className="text-primary font-bold">₹{selectedDvr?.price.toLocaleString("en-IN")}</span>
                </div>
                {selectedCams.map(({ cam, qty }) => (
                  <div key={cam.id} className="flex justify-between text-sm">
                    <span>{cam.name} × {qty}</span>
                    <span className="text-primary font-bold">₹{(cam.price * qty).toLocaleString("en-IN")}</span>
                  </div>
                ))}
                <div className="border-t border-border/30 pt-3 mt-3 flex justify-between items-center">
                  <span className="font-bold text-lg text-foreground">Hardware Total</span>
                  <span className="text-primary font-black text-2xl">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* TARIKA B - Professional Disclaimer Box */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 text-amber-500/90 text-sm">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-500 mb-1">Installation & Wiring Extra</p>
                  <p className="opacity-90">To give you the fairest price, installation charges and wire/casing costs are calculated on-site by our expert technicians based on actual usage.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" onClick={orderViaWhatsApp}>
                  Order via WhatsApp
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KitBuilder;