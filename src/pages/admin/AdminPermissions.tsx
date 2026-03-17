import { useState, useEffect } from "react";
import { Shield, Check, X, Loader2, Search, ShoppingCart, Package, MessageSquare, Star, HelpCircle, Users, BarChart3, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// 🚀 Naye pages yahan add kiye gaye hain
const PAGE_OPTIONS = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "products", label: "Products", icon: Package },
  { key: "kit-builder", label: "Kit Builder", icon: Wrench }, // Naya
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "testimonials", label: "Testimonials", icon: Star },
  { key: "faqs", label: "FAQs", icon: HelpCircle },
  { key: "users", label: "Users", icon: Users }, // Naya
];

interface AdminUser {
  user_id: string;
  full_name: string | null;
  role: string;
  permissions: string[];
}

const AdminPermissions = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      // Get all users with Admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("role", "Admin");

      if (roleError) throw roleError;

      if (!roleData || roleData.length === 0) {
        setAdmins([]);
        setLoading(false);
        return;
      }

      const userIds = roleData.map(r => r.user_id);

      // Get profiles for these users
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      // Get permissions for these users
      const { data: permData } = await supabase
        .from("admin_permissions")
        .select("user_id, page_key")
        .in("user_id", userIds);

      const adminList: AdminUser[] = roleData.map(r => {
        const profile = profileData?.find(p => p.user_id === r.user_id);
        const perms = permData?.filter(p => p.user_id === r.user_id).map(p => p.page_key) || [];
        return {
          user_id: r.user_id,
          full_name: profile?.full_name || "Unknown",
          role: r.role,
          permissions: perms,
        };
      });

      setAdmins(adminList);
    } catch (err: any) {
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const togglePermission = async (adminUserId: string, pageKey: string, hasPermission: boolean) => {
    setSaving(`${adminUserId}-${pageKey}`);
    try {
      if (hasPermission) {
        // Remove permission
        await supabase
          .from("admin_permissions")
          .delete()
          .eq("user_id", adminUserId)
          .eq("page_key", pageKey);
      } else {
        // Add permission
        await supabase
          .from("admin_permissions")
          .insert({ user_id: adminUserId, page_key: pageKey, granted_by: user?.id });
      }
      
      // Update local state
      setAdmins(prev => prev.map(a => {
        if (a.user_id === adminUserId) {
          return {
            ...a,
            permissions: hasPermission
              ? a.permissions.filter(p => p !== pageKey)
              : [...a.permissions, pageKey]
          };
        }
        return a;
      }));
      
      toast.success(hasPermission ? "Permission Revoked" : "Permission Granted");
    } catch (err: any) {
      toast.error("Failed to update permission");
    } finally {
      setSaving(null);
    }
  };

  const grantAllPermissions = async (adminUserId: string) => {
    setSaving(adminUserId);
    try {
      const admin = admins.find(a => a.user_id === adminUserId);
      const missingPerms = PAGE_OPTIONS.filter(p => !admin?.permissions.includes(p.key));
      
      if (missingPerms.length > 0) {
        await supabase.from("admin_permissions").insert(
          missingPerms.map(p => ({ user_id: adminUserId, page_key: p.key, granted_by: user?.id }))
        );
      }
      
      setAdmins(prev => prev.map(a => {
        if (a.user_id === adminUserId) {
          return { ...a, permissions: PAGE_OPTIONS.map(p => p.key) };
        }
        return a;
      }));
      
      toast.success("All access granted to user");
    } catch (err) {
      toast.error("Failed to grant permissions");
    } finally {
      setSaving(null);
    }
  };

  const revokeAllPermissions = async (adminUserId: string) => {
    setSaving(adminUserId);
    try {
      await supabase.from("admin_permissions").delete().eq("user_id", adminUserId);
      
      setAdmins(prev => prev.map(a => {
        if (a.user_id === adminUserId) {
          return { ...a, permissions: [] };
        }
        return a;
      }));
      
      toast.success("All access revoked from user");
    } catch (err) {
      toast.error("Failed to revoke permissions");
    } finally {
      setSaving(null);
    }
  };

  const filteredAdmins = admins.filter(a =>
    a.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-primary/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3 italic uppercase tracking-tighter">
            <Shield className="w-8 h-8 text-primary" />
            Admin <span className="text-primary">Permissions</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-bold opacity-50 uppercase tracking-widest mt-1">
            System Access Control Center
          </p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 bg-card/50 border-primary/20 rounded-xl shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Scanning Registry...</p>
          </div>
        </div>
      ) : filteredAdmins.length === 0 ? (
        <div className="text-center py-32 border-2 border-dashed border-border/40 rounded-3xl bg-card/20">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
          <p className="text-lg font-bold">No Admin Users Found</p>
          <p className="text-sm text-muted-foreground mt-1">You need to promote standard users to 'Admin' role first.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAdmins.map(admin => (
            <div key={admin.user_id} className="p-5 md:p-6 rounded-2xl border-2 border-primary/5 bg-card/40 backdrop-blur-sm shadow-xl hover:border-primary/20 transition-all">
              
              {/* User Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-border/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl">
                     {admin.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">{admin.full_name}</h3>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mt-0.5 px-2 py-0.5 bg-muted rounded inline-block">{admin.role}</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    onClick={() => grantAllPermissions(admin.user_id)}
                    disabled={saving === admin.user_id}
                    className="h-9 px-4 text-[10px] font-black uppercase tracking-wider bg-primary hover:bg-primary/90"
                  >
                    Grant All Access
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => revokeAllPermissions(admin.user_id)}
                    disabled={saving === admin.user_id}
                    className="h-9 px-4 text-[10px] font-black uppercase tracking-wider text-destructive border-destructive/20 hover:bg-destructive/10"
                  >
                    Revoke All
                  </Button>
                </div>
              </div>
              
              {/* Permissions Grid */}
              <div>
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block mb-4">Module Access Control</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {PAGE_OPTIONS.map(page => {
                    const hasPermission = admin.permissions.includes(page.key);
                    const isSaving = saving === `${admin.user_id}-${page.key}`;
                    
                    return (
                      <button
                        key={page.key}
                        onClick={() => togglePermission(admin.user_id, page.key, hasPermission)}
                        disabled={!!saving}
                        className={`flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                          hasPermission
                            ? "bg-primary/5 border-primary/30 text-primary shadow-sm"
                            : "bg-background/50 border-border/40 text-muted-foreground hover:border-primary/20 hover:bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <page.icon className={`w-5 h-5 ${hasPermission ? "text-primary" : "opacity-50"}`} />
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${hasPermission ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border'}`}>
                            {isSaving ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : hasPermission ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <X className="w-3 h-3 opacity-50" />
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-bold tracking-tight">{page.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPermissions;