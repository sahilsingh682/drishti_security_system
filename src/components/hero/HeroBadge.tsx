import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const fullText = "LIVE SURVEILLANCE ACTIVE";

export const HeroBadge = () => {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card neon-border-amber"
    >
      <span className={`w-2 h-2 rounded-full bg-primary ${done ? "animate-pulse-glow" : ""}`} />
      <span className="font-mono text-xs tracking-[0.2em] text-primary font-medium">
        {text}
        {!done && <span className="animate-pulse">▌</span>}
      </span>
    </motion.div>
  );
};
