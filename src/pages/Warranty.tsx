import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ShieldCheck, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Warranty = () => {
  const [serial, setSerial] = useState("");
  const [result, setResult] = useState<null | "found" | "not_found">(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResult(serial.toUpperCase().startsWith("DSS") ? "found" : "not_found");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background grid-bg pt-20 pb-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <span className="text-xs font-mono tracking-[0.3em] text-primary uppercase">Product Verification</span>
          <h1 className="text-3xl font-bold mt-3">Warranty <span className="text-gradient-amber">Check</span></h1>
          <p className="text-sm text-muted-foreground mt-2">Enter your product serial number to check warranty status</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 neon-border-amber">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="e.g. DSS-2024-XXXX" value={serial} onChange={e => setSerial(e.target.value)} className="pl-10 bg-muted/30 border-border/50" />
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
              {loading ? "..." : "Check"}
            </Button>
          </form>

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-6 p-4 rounded-lg border ${
              result === "found" ? "bg-green-500/10 border-green-500/30" : "bg-destructive/10 border-destructive/30"
            }`}>
              {result === "found" ? (
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="font-semibold text-sm text-green-400">Warranty Active</p>
                    <p className="text-xs text-muted-foreground">Valid until Dec 2027 · Product registered</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                  <div>
                    <p className="font-semibold text-sm text-destructive">Not Found</p>
                    <p className="text-xs text-muted-foreground">Serial number not recognized. Contact support.</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Warranty;
