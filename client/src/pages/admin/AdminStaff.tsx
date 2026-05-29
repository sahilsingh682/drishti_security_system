import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Phone, UserPlus, Mail, Edit, ShieldCheck, Power, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AdminStaff() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 🚀 Added Email and is_active to form state
  const [form, setForm] = useState({ name: "", phone: "", email: "", is_active: true });

  const fetchStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("staff").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Failed to load staff");
    setStaff(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ name: "", phone: "", email: "", is_active: true });
    setModalOpen(true);
  };

  const handleOpenEdit = (member: any) => {
    setEditingId(member.id);
    setForm({ 
      name: member.name || "", 
      phone: member.phone || "", 
      email: member.email || "", 
      is_active: member.is_active ?? true 
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, role: "technician" }; // Ensuring role is set

    try {
      if (editingId) {
        const { error } = await supabase.from("staff").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Technician details updated!");
      } else {
        const { error } = await supabase.from("staff").insert([payload]);
        if (error) throw error;
        toast.success("New Technician added successfully!");
      }
      setModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || "Failed to save technician");
    }
  };

  const deleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to permanently remove this technician?")) return;
    const { error } = await supabase.from("staff").delete().eq("id", id);
    if (error) toast.error("Failed to remove staff");
    else {
      toast.success("Technician removed permanently");
      fetchStaff();
    }
  };

  const toggleActiveStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("staff").update({ is_active: !currentStatus }).eq("id", id);
    if (error) toast.error("Failed to update status");
    else {
      toast.success(`Technician marked as ${!currentStatus ? 'Active' : 'Inactive'}`);
      fetchStaff();
    }
  };

  if (loading) return <div className="p-20 text-center font-black text-primary animate-pulse tracking-widest uppercase">Syncing Team Data...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 🚀 Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-primary/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3 italic uppercase tracking-tighter">
            <Users className="w-8 h-8 text-primary" />
            Team <span className="text-primary">Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-bold opacity-50 uppercase tracking-widest mt-1">
            Manage your installation experts & technicians
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-primary hover:bg-primary/90 h-11 px-6 rounded-full font-black uppercase tracking-wider shadow-lg shadow-primary/20 transition-all hover:scale-105">
          <UserPlus className="w-4 h-4 mr-2" /> Add Expert
        </Button>
      </div>

      {/* 🚀 Empty State */}
      {staff.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border/40 rounded-3xl bg-card/20">
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
          <p className="text-lg font-bold">No Technicians Found</p>
          <p className="text-sm text-muted-foreground mt-1">Add your team members so you can assign them to installations.</p>
        </div>
      ) : (
        /* 🚀 Team Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              key={member.id} 
              className={`glass-card p-6 rounded-2xl border-2 transition-all hover:shadow-xl ${member.is_active ? 'border-primary/10 hover:border-primary/30' : 'border-destructive/10 opacity-75'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl border ${member.is_active ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                    {member.name?.charAt(0).toUpperCase() || "T"}
                  </div>
                  <div>
                    <h3 className="font-black tracking-tight text-lg leading-none">{member.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] bg-muted px-2 py-0.5 rounded font-black uppercase tracking-widest text-muted-foreground">Expert</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest flex items-center gap-1 ${member.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                        {member.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6 p-3 bg-muted/30 rounded-xl border border-border/40">
                <div className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                  <Phone className="w-4 h-4 text-primary opacity-70" /> {member.phone || "No Phone"}
                </div>
                <div className="flex items-center gap-2.5 text-sm font-medium text-foreground truncate">
                  <Mail className="w-4 h-4 text-primary opacity-70" /> {member.email || "No Email Linked"}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-border/40">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(member)} className="flex-1 h-9 text-xs font-bold border-primary/20 hover:bg-primary/5">
                  <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                </Button>
                <Button variant="outline" size="icon" onClick={() => toggleActiveStatus(member.id, member.is_active)} className={`h-9 w-9 border-border/50 hover:bg-muted ${!member.is_active && 'text-emerald-500'}`}>
                  <Power className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => deleteStaff(member.id)} className="h-9 w-9 border-destructive/20 text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 🚀 Dynamic Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="glass-card border-border/40 sm:max-w-md rounded-3xl p-0 overflow-hidden">
          <div className="bg-primary/5 p-6 border-b border-primary/10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" /> {editingId ? "Edit Expert Details" : "Register New Expert"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Assign an email address so the technician can log in to their dedicated service panel.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Full Name</Label>
              <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Rahul Sharma" className="h-11 bg-muted/30 border-border/50" />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Phone Number</Label>
              <Input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="e.g. 98120XXXXX" className="h-11 bg-muted/30 border-border/50" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-black tracking-widest text-primary flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> Login Email (Crucial)
              </Label>
              <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="rahul@drishtisecurity.com" className="h-11 bg-primary/5 border-primary/20 focus-visible:ring-primary/30" />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-sm rounded-xl shadow-lg shadow-primary/20">
                {editingId ? "Update System Registry" : "Register Expert"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}