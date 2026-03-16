import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BarChart3, ShoppingCart, Users, MessageSquare, Package, TrendingUp, IndianRupee, Clock, CheckCircle2, AlertCircle, Wifi } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const COLORS = ["hsl(25, 95%, 53%)", "hsl(217, 91%, 60%)", "hsl(150, 60%, 50%)", "hsl(0, 84%, 60%)", "hsl(280, 60%, 55%)"];

interface Order {
  payment_status: string;
  install_status: string;
  total_amount: number;
  created_at: string;
  customer_name: string;
  id: string;
}

interface Message {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ orders: 0, products: 0, users: 0, messages: 0, revenue: 0, unreadMessages: 0 });
  const [paymentStatusData, setPaymentStatusData] = useState<any[]>([]);
  const [installStatusData, setInstallStatusData] = useState<any[]>([]);
  const [revenueByDay, setRevenueByDay] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchAll = useCallback(async () => {
    const [ordersCount, productsCount, usersCount, messagesCount] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("contact_messages").select("*", { count: "exact", head: true }),
    ]);

    const [{ data: allOrders }, unreadMsgs, { data: latestOrders }, { data: latestMessages }] = await Promise.all([
      supabase.from("orders").select("payment_status, install_status, total_amount, created_at"),
      supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("status", "unread"),
      supabase.from("orders").select("id, customer_name, total_amount, payment_status, install_status, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("contact_messages").select("id, name, email, status, created_at").order("created_at", { ascending: false }).limit(5),
    ]);

    const revenue = allOrders?.reduce((s, o) => s + Number(o.total_amount), 0) || 0;

    setStats({
      orders: ordersCount.count || 0,
      products: productsCount.count || 0,
      users: usersCount.count || 0,
      messages: messagesCount.count || 0,
      revenue,
      unreadMessages: unreadMsgs.count || 0,
    });

    if (allOrders) {
      // Payment status pie
      const byPayment = allOrders.reduce((acc: Record<string, number>, o) => {
        acc[o.payment_status] = (acc[o.payment_status] || 0) + 1;
        return acc;
      }, {});
      setPaymentStatusData(Object.entries(byPayment).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })));

      // Install status pie
      const byInstall = allOrders.reduce((acc: Record<string, number>, o) => {
        acc[o.install_status] = (acc[o.install_status] || 0) + 1;
        return acc;
      }, {});
      setInstallStatusData(Object.entries(byInstall).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })));

      // Revenue by last 7 days
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });
      const byDay = last7.map(day => {
        const dayOrders = allOrders.filter(o => o.created_at.startsWith(day));
        return {
          date: new Date(day).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          revenue: dayOrders.reduce((s, o) => s + Number(o.total_amount), 0),
          orders: dayOrders.length,
        };
      });
      setRevenueByDay(byDay);
    }

    setRecentOrders((latestOrders as Order[]) || []);
    setRecentMessages((latestMessages as Message[]) || []);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    fetchAll();

    // Realtime subscriptions
    const channel = supabase
      .channel("admin-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchAll())
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  const statCards = [
    { icon: ShoppingCart, label: "Total Orders", value: stats.orders, color: "text-primary", bg: "bg-primary/10", path: "/admin/orders" },
    { icon: IndianRupee, label: "Revenue", value: `₹${stats.revenue.toLocaleString("en-IN")}`, color: "text-emerald-500", bg: "bg-emerald-500/10", path: "/admin/orders" },
    { icon: Package, label: "Products", value: stats.products, color: "text-secondary", bg: "bg-secondary/10", path: "/admin/products" },
    { icon: Users, label: "Users", value: stats.users, color: "text-primary", bg: "bg-primary/10", path: "/admin/users" },
    { icon: MessageSquare, label: "Messages", value: stats.messages, color: "text-secondary", bg: "bg-secondary/10", path: "/admin/messages" },
    { icon: AlertCircle, label: "Unread Messages", value: stats.unreadMessages, color: "text-destructive", bg: "bg-destructive/10", path: "/admin/messages" },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-600",
      paid: "bg-emerald-500/10 text-emerald-600",
      completed: "bg-emerald-500/10 text-emerald-600",
      cancelled: "bg-destructive/10 text-destructive",
      unread: "bg-primary/10 text-primary",
      read: "bg-muted text-muted-foreground",
    };
    return map[status] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Overview of your security business</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wifi className={`w-3.5 h-3.5 ${isLive ? "text-emerald-500" : "text-destructive"}`} />
          <span>{isLive ? "Live" : "Offline"}</span>
          <span className="hidden sm:inline">· Updated {lastUpdated.toLocaleTimeString("en-IN")}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => navigate(stat.path)}
            className="glass-card p-4 cursor-pointer hover:shadow-md hover:shadow-primary/5 hover:border-primary/20 transition-all duration-200"
            data-clickable
          >
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
            </div>
            <div className="text-xl font-bold truncate">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Revenue Area Chart */}
        <div className="glass-card p-3 sm:p-4 md:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-primary" /> Revenue (Last 7 Days)
          </h3>
          <div className="h-52">
            {revenueByDay.some(d => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueByDay}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(25, 95%, 53%)" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No revenue data this week</div>
            )}
          </div>
        </div>

        {/* Payment Status Pie */}
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
            <IndianRupee className="w-4 h-4 text-secondary" /> Payment Status
          </h3>
          <div className="h-52">
            {paymentStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                    {paymentStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Orders by Day Bar + Install Status Pie */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="glass-card p-3 sm:p-4 md:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4 text-secondary" /> Orders (Last 7 Days)
          </h3>
          <div className="h-48">
            {revenueByDay.some(d => d.orders > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByDay}>
                  <XAxis dataKey="date" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="orders" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No orders this week</div>
            )}
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Installation Status
          </h3>
          <div className="h-48">
            {installStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={installStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                    {installStatusData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Recent Orders */}
        <div className="glass-card p-3 sm:p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary" /> Recent Orders
          </h3>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge(o.payment_status)}`}>
                      {o.payment_status}
                    </span>
                    <span className="font-semibold text-xs">₹{Number(o.total_amount).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">No orders yet</div>
          )}
        </div>

        {/* Recent Messages */}
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-secondary" /> Recent Messages
          </h3>
          {recentMessages.length > 0 ? (
            <div className="space-y-3">
              {recentMessages.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge(m.status)}`}>
                      {m.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">No messages yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
