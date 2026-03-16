import { useState, useEffect } from "react";
import { Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AddressInput, type AddressData } from "@/components/AddressInput";

interface Props {
  product: any | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WhatsAppCheckoutModal = ({ product, open, onClose, onSuccess }: Props) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<AddressData>({
    pincode: "", city: "", state: "", houseNo: "", society: "", landmark: "", area: "",
  });

  // Auto-fill from profile
  useEffect(() => {
    if (profile && open) {
      const nameParts = (profile.full_name || "").split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
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
  }, [profile, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setLoading(true);

    try {
      const orderData = {
        user_id: user?.id || null,
        customer_name: `${firstName} ${lastName}`.trim(),
        phone,
        delivery_address: {
          pincode: address.pincode, city: address.city, state: address.state,
          houseNo: address.houseNo, society: address.society, landmark: address.landmark, area: address.area,
          lat: address.lat, lng: address.lng,
        },
        items: [{ id: product.id, name: product.name, price: product.price, qty: 1 }],
        total_amount: product.price,
        whatsapp_sync: true,
      };

      if (user) {
        await supabase.from("orders").insert(orderData);
      }

      const msg = encodeURIComponent(
        `🔒 *Drishti Security - New Order*\n\n` +
        `*Product:* ${product.name}\n` +
        `*Price:* ₹${Number(product.price).toLocaleString()}\n\n` +
        `*Customer:* ${firstName} ${lastName}\n` +
        `*Phone:* ${phone}\n` +
        `*Address:* ${address.houseNo ? address.houseNo + ', ' : ''}${address.society}, ${address.area ? address.area + ', ' : ''}${address.landmark ? address.landmark + ', ' : ''}${address.city}, ${address.state} - ${address.pincode}` +
        (address.lat ? `\n*📍 Map:* https://www.google.com/maps?q=${address.lat},${address.lng}` : '')
      );

      window.open(`https://wa.me/919812019772?text=${msg}`, "_blank");
      toast.success(
        `✅ Order confirmed!\n\n📦 ${product.name}\n💰 ₹${Number(product.price).toLocaleString()}\n👤 ${firstName} ${lastName}\n📍 ${address.city}, ${address.state}`,
        { duration: 6000 }
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-card border-border/40 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Delivery Details</DialogTitle>
        </DialogHeader>
        {product && (
          <div className="mb-4 p-3 rounded-lg bg-muted/20 border border-border/20">
            <div className="font-semibold text-sm">{product.name}</div>
            <div className="text-primary font-bold">₹{Number(product.price).toLocaleString()}</div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">First Name</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input required value={firstName} onChange={e => setFirstName(e.target.value)} className="pl-10 bg-muted/30" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Last Name</Label>
              <Input required value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 bg-muted/30" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input required value={phone} onChange={e => setPhone(e.target.value)} className="pl-10 bg-muted/30" placeholder="+91 98765 43210" />
            </div>
          </div>

          <div className="pt-2 border-t border-border/30">
            <AddressInput value={address} onChange={setAddress} required />
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
            {loading ? "Processing..." : "Order via WhatsApp"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
