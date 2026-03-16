import { useState, useEffect } from "react";
import { Shield, Check, X, Loader2, Search, ShoppingCart, Package, MessageSquare, Star, HelpCircle, Users, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const PAGE_OPTIONS = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "products", label: "Products", icon: Package },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "testimonials", label: "Testimonials", icon: Star },
  { key: "faqs", label: "FAQs", icon: HelpCircle },
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
      
      toast.success(hasPermission ? "Permission removed" : "Permission granted");
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
      
      toast.success("All permissions granted");
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
      
      toast.success("All permissions revoked");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Admin Permissions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage which pages admins can access
          </p>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search admins..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-muted/30"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredAdmins.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No admins found</p>
          <p className="text-sm mt-1">Promote users to Admin role first</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAdmins.map(admin => (
            <div key={admin.user_id} className="p-4 rounded-xl border border-border/40 bg-card/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{admin.full_name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{admin.role}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => grantAllPermissions(admin.user_id)}
                    disabled={saving === admin.user_id}
                    className="text-xs"
                  >
                    Grant All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => revokeAllPermissions(admin.user_id)}
                    disabled={saving === admin.user_id}
                    className="text-xs text-destructive hover:text-destructive"
                  >
                    Revoke All
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {PAGE_OPTIONS.map(page => {
                  const hasPermission = admin.permissions.includes(page.key);
                  const isSaving = saving === `${admin.user_id}-${page.key}`;
                  
                  return (
                    <button
                      key={page.key}
                      onClick={() => togglePermission(admin.user_id, page.key, hasPermission)}
                      disabled={!!saving}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-all ${
                        hasPermission
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted/20 border-border/30 text-muted-foreground hover:border-border/50"
                      }`}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : hasPermission ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4 opacity-50" />
                      )}
                      <page.icon className="w-4 h-4" />
                      <span className="truncate">{page.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPermissions;
