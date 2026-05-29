import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wrench, Phone, MapPin, CheckCircle2, Clock, PlayCircle, 
  ClipboardList, ShieldAlert, Package, Undo2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const parseItemsRobust = (itemsData: any) => {
  if (!itemsData) return [];
  try {
    const arr = typeof itemsData === "string" ? JSON.parse(itemsData) : itemsData;
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
};

const parseAddress = (addr: any): string => {
  if (!addr) return "—";
  try {
    const a = typeof addr === "string" ? JSON.parse(addr) : addr;
    return [a.houseNo, a.society, a.landmark, a.area, a.city, a.pincode].filter(Boolean).join(", ");
  } catch {
    return String(addr);
  }
};

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const [staffData, setStaffData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAndFetchTasks = async () => {
      if (!user?.email) return;

      try {
        const { data: staff, error: staffError } = await supabase
          .from("staff")
          .select("*")
          .eq("email", user.email)
          .eq("is_active", true)
          .single();

        if (staffError || !staff) {
          setLoading(false);
          return; 
        }
        setStaffData(staff);

        const { data: assignedOrders, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("assigned_technician_id", staff.id)
          .neq("install_status", "cancelled")
          .order("created_at", { ascending: false });

        if (!ordersError && assignedOrders) {
          setOrders(assignedOrders);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    verifyAndFetchTasks();

    const channel = supabase
      .channel('technician-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        verifyAndFetchTasks(); 
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const updateOrderStatus = async (orderId: string, status: string, isUndo = false) => {
    toast.loading(isUndo ? "Reverting status..." : "Updating status...", { id: "status-update" });
    const { error } = await supabase.from("orders").update({ install_status: status }).eq("id", orderId);
    
    if (error) {
      toast.error("Failed to update status", { id: "status-update" });
    } else {
      toast.success(isUndo ? "Action undone successfully!" : `Task marked as ${status.replace('_', ' ')}`, { id: "status-update" });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, install_status: status } : o));
    }
  };

  const updateNotes = async (orderId: string, notes: string) => {
    const { error } = await supabase.from("orders").update({ technician_notes: notes }).eq("id", orderId);
    if (!error) toast.success("Notes saved successfully");
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  if (!staffData) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="w-16 h-16 text-destructive/50 mb-4" />
        <h1 className="text-2xl font-black uppercase tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground mt-2 max-w-md">Your email address is not registered as an active technician in our system. Please contact the Admin.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/50 pt-24 pb-20 px-4 md:px-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8 bg-card p-4 rounded-2xl border border-primary/10 shadow-sm">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-black text-2xl">
          {staffData.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight">{staffData.name}</h1>
          <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase flex items-center gap-1.5 mt-0.5">
            <Wrench className="w-3 h-3" /> Field Expert Portal
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="font-black text-lg uppercase tracking-widest text-primary/80 flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5" /> My Assigned Tasks ({orders.length})
        </h2>

        <AnimatePresence>
          {orders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 border-2 border-dashed border-border/50 rounded-3xl bg-card/30">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
              <p className="font-bold text-lg">No Pending Tasks!</p>
              <p className="text-xs text-muted-foreground mt-1">You're all caught up for now. Relax!</p>
            </motion.div>
          ) : (
            orders.map((order, i) => {
              const isCompleted = order.install_status === 'completed';
              const items = parseItemsRobust(order.items);
              
              return (
                <motion.div 
                  key={order.id} 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className={`bg-card rounded-3xl border-2 overflow-hidden shadow-lg transition-colors ${isCompleted ? 'border-emerald-500/30 bg-emerald-500/[0.03]' : 'border-primary/20'}`}
                >
                  <div className={`px-5 py-3 border-b flex justify-between items-center ${isCompleted ? 'border-emerald-500/10 bg-emerald-500/5' : 'border-primary/10 bg-primary/5'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">ID: {order.id.slice(0, 8)}</span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5 ${
                      isCompleted ? 'bg-emerald-500/20 text-emerald-600' : 'bg-orange-500/20 text-orange-600'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {order.install_status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-5 space-y-5">
                    <div>
                      <h3 className="text-xl font-black">{order.customer_name}</h3>
                      
                      <div className="flex gap-3 mt-4">
                        <a 
                          href={`tel:${order.phone}`} 
                          className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-colors border border-emerald-500/20 shadow-sm"
                        >
                          <Phone className="w-4 h-4" /> Call Client
                        </a>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parseAddress(order.delivery_address))}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-colors border border-blue-500/20 shadow-sm"
                        >
                          <MapPin className="w-4 h-4" /> Navigate
                        </a>
                      </div>

                      <p className="text-xs text-muted-foreground mt-4 leading-relaxed p-3 bg-muted/30 rounded-lg border border-border/40">
                        {parseAddress(order.delivery_address)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Equipment Checklist</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs p-3 rounded-xl border border-border/60 bg-background shadow-sm hover:border-primary/20 transition-colors">
                            <span className="font-bold flex items-center gap-2 truncate">
                              <Package className="w-4 h-4 text-primary shrink-0" /> {item.name || "Item"}
                            </span>
                            <span className="font-black bg-primary/10 text-primary px-2.5 py-1 rounded-md ml-2 shrink-0">x{item.qty || 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 🚀 SMART ACTION AREA */}
                    <div className="border-t border-border/50 pt-5 space-y-4">
                      
                      {!isCompleted ? (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Installation Notes (Optional)</Label>
                            <textarea 
                              className="w-full h-16 bg-muted/30 rounded-xl p-3 text-xs resize-none border border-border/50 focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                              placeholder="Type any remarks or serial numbers here..."
                              defaultValue={order.technician_notes}
                              onBlur={(e) => updateNotes(order.id, e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              variant="outline"
                              onClick={() => updateOrderStatus(order.id, 'in_progress')} 
                              className={`h-12 rounded-xl text-xs font-black uppercase tracking-wider ${order.install_status === 'in_progress' ? 'bg-orange-500/10 border-orange-500/30 text-orange-600 shadow-inner' : 'hover:bg-muted'}`}
                            >
                              <PlayCircle className="w-4 h-4 mr-2" /> Start Work
                            </Button>
                            <Button 
                              onClick={() => updateOrderStatus(order.id, 'completed')} 
                              className="h-12 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Done
                            </Button>
                          </div>
                        </>
                      ) : (
                        /* 🚀 NEW: UNDO FEATURE FOR COMPLETED TASKS */
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-sm font-black uppercase tracking-wider">Installation Done</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'in_progress', true)} 
                            className="h-9 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-orange-500 border-border/50 bg-background"
                          >
                            <Undo2 className="w-3.5 h-3.5 mr-1.5" /> Undo Action
                          </Button>
                        </div>
                      )}

                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}