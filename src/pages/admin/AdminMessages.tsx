import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Mail, Eye, EyeOff, Trash2, Search, Filter, CheckCheck, Clock, ChevronDown, ChevronUp, Reply, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type FilterTab = "all" | "unread" | "read";

const AdminMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const markRead = async (id: string, status: string) => {
    const newStatus = status === "unread" ? "read" : "unread";
    const { error } = await supabase.from("contact_messages").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked as ${newStatus}`);
    fetchMessages();
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Message deleted");
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    fetchMessages();
  };

  const bulkMarkRead = async () => {
    if (selectedIds.size === 0) return;
    const { error } = await supabase
      .from("contact_messages")
      .update({ status: "read" })
      .in("id", Array.from(selectedIds));
    if (error) { toast.error(error.message); return; }
    toast.success(`${selectedIds.size} messages marked as read`);
    setSelectedIds(new Set());
    fetchMessages();
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .in("id", Array.from(selectedIds));
    if (error) { toast.error(error.message); return; }
    toast.success(`${selectedIds.size} messages deleted`);
    setSelectedIds(new Set());
    fetchMessages();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredMessages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMessages.map(m => m.id)));
    }
  };

  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      const matchesFilter = filter === "all" || m.status === filter;
      const matchesSearch = search === "" ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.message.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [messages, filter, search]);

  const unreadCount = messages.filter(m => m.status === "unread").length;
  const readCount = messages.filter(m => m.status === "read").length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    if (diffDays < 7) return `${Math.floor(diffDays)}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: messages.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "read", label: "Read", count: readCount },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" /> Messages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? (
              <span className="text-primary font-medium">{unreadCount} unread</span>
            ) : (
              "All caught up!"
            )}
            {" · "}{messages.length} total
          </p>
        </div>
      </div>

      {/* Search + Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or message..."
            className="pl-10 bg-muted/30 border-border/50"
          />
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-muted/40 border border-border/30">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-clickable
            >
              {tab.label}
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === tab.key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <Badge variant="secondary" className="text-xs">
              {selectedIds.size} selected
            </Badge>
            <Button size="sm" variant="outline" onClick={bulkMarkRead} className="h-7 text-xs gap-1">
              <CheckCheck className="w-3 h-3" /> Mark Read
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <Trash2 className="w-3 h-3" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selectedIds.size} messages?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={bulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="h-7 text-xs">
              Clear
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            {search ? "No messages match your search" : filter !== "all" ? `No ${filter} messages` : "No messages yet"}
          </p>
          {search && (
            <Button size="sm" variant="ghost" onClick={() => setSearch("")} className="mt-2 text-xs">
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {/* Select All */}
          <div className="flex items-center gap-2 px-2 pb-1">
            <input
              type="checkbox"
              checked={selectedIds.size === filteredMessages.length && filteredMessages.length > 0}
              onChange={selectAll}
              className="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
            />
            <span className="text-xs text-muted-foreground">Select all ({filteredMessages.length})</span>
          </div>

          {filteredMessages.map((msg, i) => {
            const isExpanded = expandedId === msg.id;
            const isSelected = selectedIds.has(msg.id);
            const isUnread = msg.status === "unread";

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`group rounded-xl border transition-all duration-200 ${
                  isUnread
                    ? "bg-primary/[0.03] border-primary/20 shadow-sm"
                    : "bg-card/50 border-border/30 hover:border-border/50"
                } ${isSelected ? "ring-1 ring-primary/40" : ""}`}
              >
                {/* Main Row */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                  data-clickable
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => { e.stopPropagation(); toggleSelect(msg.id); }}
                    className="w-3.5 h-3.5 mt-1 rounded border-border accent-primary cursor-pointer shrink-0"
                    onClick={e => e.stopPropagation()}
                  />

                  {/* Unread dot */}
                  <div className="mt-2 shrink-0">
                    {isUnread ? (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-transparent" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm truncate ${isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                        {msg.name}
                      </span>
                      {isUnread && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary bg-primary/5 shrink-0">
                          NEW
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{msg.email}</span>
                    </div>
                    <p className={`text-sm text-muted-foreground ${isExpanded ? "" : "line-clamp-1"}`}>
                      {msg.message}
                    </p>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDate(msg.created_at)}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-border/20">
                        {/* Full message */}
                        <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/20">
                          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                        </div>

                        {/* Meta info */}
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Received: {new Date(msg.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                          <span>·</span>
                          <span className={`capitalize ${isUnread ? "text-primary font-medium" : ""}`}>
                            {msg.status}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={(e) => { e.stopPropagation(); markRead(msg.id, msg.status); }}
                          >
                            {isUnread ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {isUnread ? "Mark Read" : "Mark Unread"}
                          </Button>

                          <a
                            href={`mailto:${msg.email}?subject=Re: Your message to Drishti Security&body=%0A%0A---%0AOriginal message:%0A${encodeURIComponent(msg.message)}`}
                            onClick={e => e.stopPropagation()}
                            className="inline-flex"
                          >
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                              <Reply className="w-3 h-3" /> Reply via Email
                            </Button>
                          </a>

                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(`Hi ${msg.name}, regarding your message to Drishti Security...`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="inline-flex"
                          >
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                              <ExternalLink className="w-3 h-3" /> WhatsApp
                            </Button>
                          </a>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10 ml-auto"
                                onClick={e => e.stopPropagation()}
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={e => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                                <AlertDialogDescription>Message from {msg.name} will be permanently deleted.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMessage(msg.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
