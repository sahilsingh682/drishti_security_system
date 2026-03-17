import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Mail, MessageCircle, Send, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });
      if (error) throw error;
      toast.success("Message sent successfully!");
      setForm({ name: "", email: "", message: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic values fallback
  const displayPhone = settings?.phone || "+91 98120 19772";
  const displayEmail = settings?.email || "drishtisecuritysystem@gmail.com";
  const rawWhatsApp = settings?.whatsapp || "919812019772";
  const rawPhone = displayPhone.replace(/[^0-9+]/g, '');

  return (
    <div className="min-h-screen bg-background grid-bg pt-20 pb-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <span className="text-xs font-mono tracking-[0.3em] text-primary uppercase">Get In Touch</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-3">Contact <span className="text-gradient-amber">Us</span></h1>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[
            { icon: Phone, label: "Call Us", value: displayPhone, href: `tel:${rawPhone}` },
            { icon: MessageCircle, label: "WhatsApp", value: "Chat Now", href: `https://wa.me/${rawWhatsApp}` },
            { icon: Mail, label: "Email", value: displayEmail, href: `mailto:${displayEmail}` },
          ].map((item, i) => (
            <motion.a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass-card-hover p-6 text-center block" data-clickable>
              <item.icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="font-semibold text-sm">{item.label}</div>
              <div className="text-xs text-muted-foreground mt-1 truncate px-2">{item.value}</div>
            </motion.a>
          ))}
        </div>

        {/* Dynamic Address Box */}
        {settings?.address && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10 glass-card-hover p-4 text-center rounded-xl flex flex-col sm:flex-row items-center justify-center gap-3">
            <MapPin className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm font-medium text-muted-foreground">{settings.address}</span>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 md:p-8 neon-border-amber">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Name</Label>
                <Input required placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1.5 bg-muted/30 border-border/50" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
                <Input type="email" required placeholder="you@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1.5 bg-muted/30 border-border/50" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Message</Label>
              <Textarea required placeholder="How can we help?" rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="mt-1.5 bg-muted/30 border-border/50 resize-none" />
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
              {loading ? "Sending..." : <><Send className="w-4 h-4 mr-2" /> Send Message</>}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;