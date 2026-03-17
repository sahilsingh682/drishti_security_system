import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Phone, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminStaff() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });

  const fetchStaff = async () => {
    const { data } = await supabase.from("staff").select("*").order("created_at", { ascending: false });
    setStaff(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("staff").insert([form]);
    if (error) {
      toast.error("Failed to add staff");
    } else {
      toast.success("Technician added successfully!");
      setModalOpen(false);
      setForm({ name: "", phone: "" });
      fetchStaff();
    }
  };

  const deleteStaff = async (id: string) => {
    if (!confirm("Remove this technician?")) return;
    await supabase.from("staff").delete().eq("id", id);
    toast.success("Staff removed");
    fetchStaff();
  };

  if (loading) return <div className="p-10 text-center">Loading staff...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> Staff Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your technicians and installation team.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-primary">
          <UserPlus className="w-4 h-4 mr-2" /> Add Technician
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((member) => (
          <div key={member.id} className="glass-card p-5 border border-border/40 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{member.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> {member.phone}
              </p>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-2 inline-block uppercase font-bold">
                {member.role}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => deleteStaff(member.id)} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="glass-card border-border/40">
          <DialogHeader><DialogTitle>Add New Technician</DialogTitle></DialogHeader>
          <form onSubmit={handleAddStaff} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Technician Name</Label>
              <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Rahul Sharma" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="e.g. 98120XXXXX" />
            </div>
            <Button type="submit" className="w-full bg-primary">Save Technician</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}