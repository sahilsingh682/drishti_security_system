import { useState, useEffect } from "react";
import { Settings, Phone, MessageCircle, Mail, MapPin, CreditCard, Save, LocateFixed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingLoc, setFetchingLoc] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    upi_id: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from("site_settings").select("*").limit(1).single();
      if (data) {
        setSettingsId(data.id);
        setForm({
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          email: data.email || "",
          address: data.address || "",
          upi_id: data.upi_id || "",
        });
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsId) return;
    
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({
        phone: form.phone,
        whatsapp: form.whatsapp,
        email: form.email,
        address: form.address,
        upi_id: form.upi_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settingsId);

    setSaving(false);

    if (error) {
      toast.error("Failed to update settings");
    } else {
      toast.success("Website settings updated successfully!");
    }
  };

  // 📍 STRICT HIGH-ACCURACY LOCATION FETCHER
  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setFetchingLoc(true);
    toast.loading("Fetching exact GPS location...", { id: "loc" });

    // Passing High Accuracy Options
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Added accept-language=en to force readable English addresses
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
          const data = await res.json();
          
          if (data && data.display_name) {
            setForm(prev => ({ ...prev, address: data.display_name }));
            toast.success("Exact Location fetched!", { id: "loc" });
          } else {
            throw new Error("Address not found");
          }
        } catch (error) {
          toast.error("Could not resolve address from coordinates.", { id: "loc" });
        } finally {
          setFetchingLoc(false);
        }
      }, 
      (error) => {
        let errorMsg = "Could not fetch location.";
        if (error.code === 1) errorMsg = "Please allow location access in your browser settings.";
        if (error.code === 2) errorMsg = "Network or VPN issue. Disable VPN and try again.";
        if (error.code === 3) errorMsg = "Location request timed out. Try again.";
        
        toast.error(errorMsg, { id: "loc" });
        setFetchingLoc(false);
      }, 
      options
    );
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" /> Global Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update your business contact details, address, and payment info. Changes will instantly reflect across the website and invoices.
        </p>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        onSubmit={handleSave} 
        className="glass-card p-6 md:p-8 space-y-6 border-border/40"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <Phone className="w-3.5 h-3.5" /> Display Phone Number
            </Label>
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" className="bg-muted/30" />
            <p className="text-[10px] text-muted-foreground">Shown in footer and contact page.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" /> WhatsApp Number
            </Label>
            <Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="919876543210 (No + sign)" className="bg-muted/30" />
            <p className="text-[10px] text-muted-foreground">Used for order routing and chat buttons. Must include country code (e.g., 91).</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Business Email
            </Label>
            <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contact@drishtisecurity.com" className="bg-muted/30" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5" /> UPI ID (For Payments)
            </Label>
            <Input value={form.upi_id} onChange={e => setForm({ ...form, upi_id: e.target.value })} placeholder="drishti@upi" className="bg-muted/30" />
            <p className="text-[10px] text-muted-foreground">Used for generating payment QR codes or links.</p>
          </div>
        </div>

        {/* 📍 ADDRESS WITH AUTO-FETCH BUTTON */}
        <div className="space-y-2 pt-4 border-t border-border/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> Shop / Office Address
            </Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={fetchCurrentLocation} 
              disabled={fetchingLoc}
              className="h-8 text-xs bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
            >
              {fetchingLoc ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5 mr-1.5" />}
              Fetch Current Location
            </Button>
          </div>
          <Textarea 
            rows={3}
            value={form.address} 
            onChange={e => setForm({ ...form, address: e.target.value })} 
            placeholder="Enter full address here or click fetch..." 
            className="bg-muted/30 resize-none custom-scrollbar"
          />
          <p className="text-[10px] text-muted-foreground">This address will be printed on Invoices and link directly to Google Maps on the website.</p>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[150px] shadow-lg shadow-primary/20">
            {saving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Settings</>}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}