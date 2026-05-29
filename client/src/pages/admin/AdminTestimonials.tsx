import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
}

const emptyForm = { name: "", role: "", text: "", rating: 5, is_visible: true, sort_order: 0 };

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchTestimonials = async () => {
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setTestimonials(data as Testimonial[]);
    setLoading(false);
  };

  useEffect(() => { fetchTestimonials(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: testimonials.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({ name: t.name, role: t.role, text: t.text, rating: t.rating, is_visible: t.is_visible, sort_order: t.sort_order });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.text) return toast.error("Name and text are required");

    if (editing) {
      const { error } = await supabase.from("testimonials").update(form).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Testimonial updated");
    } else {
      const { error } = await supabase.from("testimonials").insert(form);
      if (error) return toast.error(error.message);
      toast.success("Testimonial added");
    }
    setDialogOpen(false);
    fetchTestimonials();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    fetchTestimonials();
  };

  const toggleVisibility = async (t: Testimonial) => {
    await supabase.from("testimonials").update({ is_visible: !t.is_visible }).eq("id", t.id);
    fetchTestimonials();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Testimonials</h1>
          <p className="text-sm text-muted-foreground mt-1">{testimonials.length} reviews</p>
        </div>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Add
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No testimonials yet. Add one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-xl border border-border/30 bg-card p-4 flex gap-4 items-start ${!t.is_visible ? "opacity-50" : ""}`}
            >
              <div className="text-muted-foreground/30 pt-1">
                <GripVertical className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{t.name}</span>
                  <span className="text-xs text-muted-foreground">· {t.role}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{t.text}</p>
                <div className="flex gap-0.5 mt-2">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className={`w-3 h-3 ${s < t.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/20"}`} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleVisibility(t)}>
                  {t.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(t.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs">Customer Name</Label>
              <Input className="mt-1.5" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div>
              <Label className="text-xs">Role / Location</Label>
              <Input className="mt-1.5" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Business Owner, City" />
            </div>
            <div>
              <Label className="text-xs">Review Text</Label>
              <Textarea className="mt-1.5" rows={3} value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} placeholder="Their experience..." />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="text-xs">Rating (1-5)</Label>
                <Input type="number" min={1} max={5} className="mt-1.5" value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Sort Order</Label>
                <Input type="number" className="mt-1.5" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_visible} onCheckedChange={v => setForm({ ...form, is_visible: v })} />
              <Label className="text-xs">Visible on homepage</Label>
            </div>
            <Button className="w-full" onClick={handleSave}>{editing ? "Update" : "Add"} Testimonial</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTestimonials;
