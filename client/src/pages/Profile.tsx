import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, Phone, Save, Camera, Package, ShieldCheck, 
  MapPin, History, Settings, HeadphonesIcon, Wrench, ChevronRight,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BackButton } from "@/components/BackButton";
import { AddressInput, type AddressData } from "@/components/AddressInput";
import { OrderHistory } from "@/components/profile/OrderHistory";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); 
  
  // 🚀 NAYA STATE: Live Order Track karne ke liye
  const [activeOrder, setActiveOrder] = useState<any>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<AddressData>({
    pincode: "", city: "", state: "", houseNo: "", society: "", landmark: "", area: "",
  });

  // 🚀 LIVE TRACKING LOGIC
  useEffect(() => {
    if (!user) return;
    
    const fetchActiveOrder = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .not("install_status", "in", '("completed","cancelled")')
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setActiveOrder(data);
    };

    fetchActiveOrder();

    // Supabase Realtime - Agar Technician update kare, toh yahan turant progress bar aage badhega!
    const channel = supabase.channel('user-active-order')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, () => {
        fetchActiveOrder();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
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
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: fullName, phone, address: JSON.stringify(address),
      }).eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profile details updated securely!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, cacheControl: '3600' });
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const timestampedUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`;
      
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: timestampedUrl }).eq("user_id", user.id);
      if (updateError) throw updateError;
      
      await refreshProfile();
      toast.success("Profile photo updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background/50 pt-24 pb-12 px-4 md:px-6">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6"><BackButton /></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 md:p-8 rounded-3xl mb-8 border border-primary/10 shadow-lg shadow-primary/5 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="relative group shrink-0">
            <div className="w-28 h-28 rounded-full bg-muted/80 border-4 border-background shadow-xl overflow-hidden flex items-center justify-center relative z-10">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-muted-foreground/50" />
              )}
            </div>
            <label className="absolute inset-0 z-20 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 backdrop-blur-sm transition-all cursor-pointer shadow-inner">
              <Camera className="w-6 h-6 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
            {uploading && <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Saving...</span>}
          </div>

          <div className="text-center sm:text-left flex-1 z-10 pt-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{profile?.full_name || "Valued Customer"}</h1>
            <p className="text-muted-foreground font-medium flex items-center justify-center sm:justify-start gap-2 mt-1">
              {user.email} {profile?.phone && <span className="hidden sm:inline">•</span>} {profile?.phone}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest mt-4">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Account
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-muted/40 p-1.5 rounded-2xl mb-8 border border-border/50">
            <TabsTrigger value="overview" className="rounded-xl font-bold uppercase tracking-wider text-xs md:text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">Dashboard</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl font-bold uppercase tracking-wider text-xs md:text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">My Orders</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl font-bold uppercase tracking-wider text-xs md:text-sm data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-black uppercase tracking-widest text-muted-foreground ml-2">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div onClick={() => navigate('/store')} className="glass-card p-5 rounded-2xl border border-border/40 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all cursor-pointer group text-center flex flex-col items-center gap-3 shadow-sm hover:shadow-md">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Package className="w-6 h-6" /></div>
                <span className="font-bold text-sm">New Order</span>
              </div>
              <div onClick={() => navigate('/warranty')} className="glass-card p-5 rounded-2xl border border-border/40 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer group text-center flex flex-col items-center gap-3 shadow-sm hover:shadow-md">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform"><ShieldCheck className="w-6 h-6" /></div>
                <span className="font-bold text-sm">Warranty</span>
              </div>
              <div onClick={() => navigate('/kit-builder')} className="glass-card p-5 rounded-2xl border border-border/40 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all cursor-pointer group text-center flex flex-col items-center gap-3 shadow-sm hover:shadow-md">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform"><Wrench className="w-6 h-6" /></div>
                <span className="font-bold text-sm">Custom Kit</span>
              </div>
              <a href="https://wa.me/918787225596" target="_blank" rel="noreferrer" className="glass-card p-5 rounded-2xl border border-border/40 hover:border-pink-500/30 hover:bg-pink-500/5 transition-all cursor-pointer group text-center flex flex-col items-center gap-3 shadow-sm hover:shadow-md">
                <div className="w-12 h-12 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform"><HeadphonesIcon className="w-6 h-6" /></div>
                <span className="font-bold text-sm">24/7 Support</span>
              </a>
            </div>

            {/* 🚀 NEW SMART TRACKING WIDGET */}
            {activeOrder ? (
              <div className="mt-8 glass-card p-6 rounded-3xl border border-orange-500/30 bg-orange-500/5 relative overflow-hidden shadow-lg shadow-orange-500/10">
                <div className="absolute top-0 left-0 w-1.5 bg-orange-500 h-full"></div>
                
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="font-black text-lg text-orange-600 dark:text-orange-400 flex items-center gap-2">
                      <Clock className="w-5 h-5 animate-pulse" /> Active Installation
                    </h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
                      Order #{activeOrder.id.slice(0, 8)}
                    </p>
                  </div>
                  <span className="bg-orange-500 text-white text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest shadow-sm">
                    {activeOrder.install_status.replace('_', ' ')}
                  </span>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="flex items-center gap-1.5 mb-5">
                  {["pending", "scheduled", "in_progress"].map((step, idx) => {
                    const currentIdx = ["pending", "scheduled", "in_progress"].indexOf(activeOrder.install_status);
                    const isActive = idx <= currentIdx;
                    return (
                      <div key={step} className="flex-1">
                        <div className={`h-2 rounded-full transition-all duration-500 ${isActive ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "bg-orange-500/20"}`} />
                        <div className={`text-[9px] font-black uppercase tracking-widest mt-1.5 text-center ${isActive ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground/50"}`}>
                          {step.replace('_', ' ')}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <Button variant="outline" onClick={() => setActiveTab("orders")} className="w-full h-12 rounded-xl border-orange-500/30 text-orange-600 hover:bg-orange-500/10 hover:text-orange-600 font-black text-xs uppercase tracking-widest transition-all">
                  View Full Details <ChevronRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            ) : (
              <div className="mt-8 glass-card p-6 rounded-3xl border border-border/50 flex items-center justify-between hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary"><History className="w-6 h-6" /></div>
                  <div>
                    <h3 className="font-black text-lg">Past Orders & Invoices</h3>
                    <p className="text-xs text-muted-foreground font-medium">No active installations right now</p>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setActiveTab("orders")} className="hidden sm:flex text-primary hover:bg-primary/10 font-bold uppercase tracking-wider text-xs">
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <OrderHistory userId={user.id} />
          </TabsContent>

          <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <motion.div className="glass-card p-6 md:p-8 rounded-3xl border border-border/50 shadow-sm">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                      <Input placeholder="Enter your full name" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-11 h-12 bg-muted/20 border-border/50 rounded-xl focus-visible:ring-primary/30" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Registered Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                      <Input placeholder="e.g. 98171XXXXX" value={phone} onChange={e => setPhone(e.target.value)} className="pl-11 h-12 bg-muted/20 border-border/50 rounded-xl focus-visible:ring-primary/30" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/40">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-primary/80">
                    <MapPin className="w-4 h-4" /> Default Delivery Address
                  </h3>
                  <div className="p-4 bg-muted/10 rounded-2xl border border-border/30">
                    <AddressInput value={address} onChange={setAddress} />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" className="w-full sm:w-auto h-12 px-8 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 font-black uppercase tracking-widest text-xs transition-all hover:scale-105" disabled={loading}>
                    {loading ? "Saving Details..." : <><Save className="w-4 h-4 mr-2" /> Save Settings</>}
                  </Button>
                </div>
              </form>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;