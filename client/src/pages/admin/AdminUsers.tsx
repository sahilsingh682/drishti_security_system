import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, ShieldCheck, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

const AdminUsers = () => {
  const { role } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    // Fetch all profiles (admin can see all via RLS)
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");

    if (profiles && roles) {
      const merged = profiles.map(p => ({
        ...p,
        role: roles.find(r => r.user_id === p.user_id)?.role || "User",
      }));
      setUsers(merged);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const changeRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from("user_roles").update({ role: newRole as "Admin" | "SuperAdmin" | "User" }).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success("Role updated");
    fetchUsers();
  };

  if (role !== "SuperAdmin") {
    return (
      <div className="glass-card p-12 text-center">
        <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">SuperAdmin access required</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">{users.length} registered users</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {users.map((user, i) => (
            <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted/50 border border-border/40 overflow-hidden flex items-center justify-center shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm">{user.full_name || "Unnamed User"}</div>
                  <div className="text-xs text-muted-foreground">{user.phone || "No phone"}</div>
                </div>
              </div>
              <Select value={user.role} onValueChange={v => changeRole(user.user_id, v)}>
                <SelectTrigger className="w-36 h-8 text-xs bg-muted/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="SuperAdmin">SuperAdmin</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
