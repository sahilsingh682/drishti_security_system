import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Ticket, Plus, Trash2, Percent, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [form, setForm] = useState({
    code: "",
    discount_type: "flat",
    discount_value: "",
    min_order_amount: "0"
  });

  const fetchCoupons = async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: form.code.toUpperCase().replace(/\s+/g, ''),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_amount: Number(form.min_order_amount)
    };

    const { error } = await supabase.from("coupons").insert(payload);
    
    if (error) {
      toast.error(error.message.includes("unique") ? "This coupon code already exists!" : "Failed to create coupon");
    } else {
      toast.success("Coupon created successfully!");
      setModalOpen(false);
      setForm({ code: "", discount_type: "flat", discount_value: "", min_order_amount: "0" });
      fetchCoupons();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await supabase.from("coupons").update({ is_active: !currentStatus }).eq("id", id);
    fetchCoupons();
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("Coupon deleted");
    fetchCoupons();
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Ticket className="w-8 h-8 text-primary" /> Promo Codes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage discount coupons for your customers.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> New Coupon
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon, i) => (
          <motion.div key={coupon.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} 
            className={`glass-card p-5 relative overflow-hidden border ${coupon.is_active ? 'border-primary/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'border-border/40 opacity-70'}`}>
            
            <div className="flex justify-between items-start mb-4">
              <div className="bg-primary/10 text-primary font-mono font-bold px-3 py-1 rounded border border-primary/20 tracking-wider">
                {coupon.code}
              </div>
              <Switch checked={coupon.is_active} onCheckedChange={() => toggleActive(coupon.id, coupon.is_active)} />
            </div>

            <div className="space-y-1 mb-6">
              <div className="text-2xl font-black text-foreground flex items-center gap-1">
                {coupon.discount_type === 'flat' ? <IndianRupee className="w-5 h-5 text-muted-foreground" /> : null}
                {coupon.discount_value}
                {coupon.discount_type === 'percentage' ? <Percent className="w-5 h-5 text-muted-foreground" /> : ' OFF'}
              </div>
              <p className="text-xs text-muted-foreground">Min. Order: ₹{coupon.min_order_amount}</p>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-muted/20 p-2 border-t border-border/30 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => deleteCoupon(coupon.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
              </Button>
            </div>
          </motion.div>
        ))}
        {coupons.length === 0 && <div className="col-span-full text-center py-10 text-muted-foreground glass-card">No coupons found. Create one to boost sales!</div>}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="glass-card border-border/40">
          <DialogHeader><DialogTitle>Create New Coupon</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Coupon Code</Label>
              <Input required placeholder="e.g. DIWALI500" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="font-mono uppercase" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={v => setForm({...form, discount_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Value</Label>
                <Input required type="number" placeholder={form.discount_type === 'flat' ? '500' : '10'} value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Minimum Order Amount (₹)</Label>
              <Input required type="number" placeholder="0 for no minimum" value={form.min_order_amount} onChange={e => setForm({...form, min_order_amount: e.target.value})} />
            </div>

            <Button type="submit" className="w-full bg-primary">Create Coupon</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}