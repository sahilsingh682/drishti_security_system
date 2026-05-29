import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wrench, Plus, Monitor, Camera, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export default function AdminKitBuilder() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ type: "camera", name: "", price: "" });

  const fetchItems = async () => {
    const { data } = await supabase.from("kit_items").select("*").order("created_at", { ascending: true });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const saveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { type: form.type, name: form.name, price: Number(form.price) };
    if (editingId) {
      await supabase.from("kit_items").update(payload).eq("id", editingId);
      toast.success("Item updated");
    } else {
      await supabase.from("kit_items").insert(payload);
      toast.success("Item added");
    }
    setModalOpen(false);
    fetchItems();
  };

  const openEdit = (item: any) => {
    setForm({ type: item.type, name: item.name, price: item.price.toString() });
    setEditingId(item.id);
    setModalOpen(true);
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    await supabase.from("kit_items").delete().eq("id", id);
    toast.success("Item deleted");
    fetchItems();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("kit_items").update({ is_active: !current }).eq("id", id);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Wrench className="w-8 h-8 text-primary" /> Kit Builder Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage cameras and DVRs available in the custom kit builder</p>
        </div>
        <Button onClick={() => { setEditingId(null); setForm({ type: "camera", name: "", price: "" }); setModalOpen(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DVRs Column */}
        <div className="glass-card p-5 border border-border/40">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Monitor className="w-5 h-5 text-secondary" /> DVR / NVR Options</h2>
          <div className="space-y-3">
            {items.filter(i => i.type === 'dvr').map(item => (
              <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${item.is_active ? 'bg-muted/20 border-border/50' : 'bg-muted/5 border-border/20 opacity-60'}`}>
                <div>
                  <p className="font-semibold text-sm">{item.name}</p>
                  <p className="text-primary font-bold text-xs">₹{item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={item.is_active} onCheckedChange={() => toggleActive(item.id, item.is_active)} />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-400" onClick={() => openEdit(item)}><Edit className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={() => deleteItem(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cameras Column */}
        <div className="glass-card p-5 border border-border/40">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Camera className="w-5 h-5 text-secondary" /> Camera Options</h2>
          <div className="space-y-3">
            {items.filter(i => i.type === 'camera').map(item => (
              <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${item.is_active ? 'bg-muted/20 border-border/50' : 'bg-muted/5 border-border/20 opacity-60'}`}>
                <div>
                  <p className="font-semibold text-sm">{item.name}</p>
                  <p className="text-primary font-bold text-xs">₹{item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={item.is_active} onCheckedChange={() => toggleActive(item.id, item.is_active)} />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-400" onClick={() => openEdit(item)}><Edit className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={() => deleteItem(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="glass-card border-border/40">
          <DialogHeader><DialogTitle>{editingId ? "Edit Item" : "Add Kit Item"}</DialogTitle></DialogHeader>
          <form onSubmit={saveItem} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="camera">Camera</SelectItem><SelectItem value="dvr">DVR/NVR</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Product Name</Label><Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. 4MP IP Camera" /></div>
            <div className="space-y-1.5"><Label>Price (₹)</Label><Input required type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
            <Button type="submit" className="w-full bg-primary">{editingId ? "Update" : "Save"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}