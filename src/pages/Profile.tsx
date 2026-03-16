import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Phone, Save, Camera, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BackButton } from "@/components/BackButton";
import { AddressInput, type AddressData } from "@/components/AddressInput";
import { OrderHistory } from "@/components/profile/OrderHistory";

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<AddressData>({
    pincode: "", city: "", state: "", houseNo: "", society: "", landmark: "", area: "",
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      if (profile.address) {
        try {
          const parsed = typeof profile.address === "string" ? JSON.parse(profile.address) : profile.address;
          setAddress({
            pincode: parsed.pincode || "",
            city: parsed.city || "",
            state: parsed.state || "",
            houseNo: parsed.houseNo || "",
            society: parsed.society || "",
            landmark: parsed.landmark || "",
            area: parsed.area || "",
            lat: parsed.lat,
            lng: parsed.lng,
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
        full_name: fullName,
        phone,
        address: JSON.stringify(address),
      }).eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profile updated successfully!");
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
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", user.id);
      if (updateError) throw updateError;
      await refreshProfile();
      toast.success("Avatar updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background grid-bg pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-lg">
        <BackButton />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <span className="text-xs font-mono tracking-[0.3em] text-primary uppercase">Account</span>
          <h1 className="text-3xl font-bold mt-2">Profile <span className="text-gradient-amber">Settings</span></h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 neon-border-amber">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-muted/50 border-2 border-border/40 overflow-hidden flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <label className="absolute inset-0 rounded-full flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" data-clickable>
                <Camera className="w-5 h-5 text-primary" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            {uploading && <span className="text-xs text-muted-foreground mt-2">Uploading...</span>}
            <p className="text-sm text-muted-foreground mt-2">{user?.email}</p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-10 bg-muted/30 border-border/50" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Phone Number</Label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} className="pl-10 bg-muted/30 border-border/50" />
              </div>
            </div>

            {/* Address Section */}
            <div className="pt-4 border-t border-border/30">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="text-primary">📍</span> Delivery Address
              </h3>
              <AddressInput value={address} onChange={setAddress} />
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
              {loading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
            </Button>
          </form>
        </motion.div>

        {user && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Order History
            </h2>
            <OrderHistory userId={user.id} />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;
