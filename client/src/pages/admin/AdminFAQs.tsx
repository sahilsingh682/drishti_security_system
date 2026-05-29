import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
}

const emptyForm = { question: "", answer: "", sort_order: 0, is_visible: true };

const AdminFAQs = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchFaqs = async () => {
    const { data } = await supabase
      .from("faqs")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setFaqs(data as FAQ[]);
    setLoading(false);
  };

  useEffect(() => { fetchFaqs(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: faqs.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (f: FAQ) => {
    setEditing(f);
    setForm({ question: f.question, answer: f.answer, sort_order: f.sort_order, is_visible: f.is_visible });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.question || !form.answer) return toast.error("Question and answer are required");

    if (editing) {
      const { error } = await supabase.from("faqs").update(form).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("FAQ updated");
    } else {
      const { error } = await supabase.from("faqs").insert(form);
      if (error) return toast.error(error.message);
      toast.success("FAQ added");
    }
    setDialogOpen(false);
    fetchFaqs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    fetchFaqs();
  };

  const toggleVisibility = async (f: FAQ) => {
    await supabase.from("faqs").update({ is_visible: !f.is_visible }).eq("id", f.id);
    fetchFaqs();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">FAQs</h1>
          <p className="text-sm text-muted-foreground mt-1">{faqs.length} questions</p>
        </div>
        <Button onClick={openNew} className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Add
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          No FAQs yet. Add one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-xl border border-border/30 bg-card p-4 flex gap-4 items-start ${!f.is_visible ? "opacity-50" : ""}`}
            >
              <div className="text-muted-foreground/30 pt-1">
                <GripVertical className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{f.question}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{f.answer}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleVisibility(f)}>
                  {f.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(f)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(f.id)}>
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
            <DialogTitle>{editing ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs">Question</Label>
              <Input className="mt-1.5" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="What do customers ask?" />
            </div>
            <div>
              <Label className="text-xs">Answer</Label>
              <Textarea className="mt-1.5" rows={4} value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} placeholder="Your answer..." />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="text-xs">Sort Order</Label>
                <Input type="number" className="mt-1.5" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.is_visible} onCheckedChange={v => setForm({ ...form, is_visible: v })} />
                <Label className="text-xs">Visible</Label>
              </div>
            </div>
            <Button className="w-full" onClick={handleSave}>{editing ? "Update" : "Add"} FAQ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFAQs;
