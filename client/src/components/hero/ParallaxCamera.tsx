import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";
import { Camera, Wifi, Circle } from "lucide-react";

export const ParallaxCamera = () => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const springX = useSpring(0, { stiffness: 50, damping: 20 });
  const springY = useSpring(0, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 30;
      const y = (e.clientY / window.innerHeight - 0.5) * 30;
      setMouse({ x, y });
      springX.set(x);
      springY.set(y);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [springX, springY]);

  return (
    <motion.div
      className="relative w-64 h-64 md:w-80 md:h-80"
      style={{ x: springX, y: springY }}
    >
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 blur-3xl" />

      {/* Main camera body */}
      <motion.div
        className="absolute inset-4 glass-card rounded-2xl flex items-center justify-center neon-border-blue overflow-hidden"
        animate={{ rotateY: mouse.x * 0.3, rotateX: -mouse.y * 0.3 }}
        transition={{ type: "spring", stiffness: 100, damping: 30 }}
        style={{ perspective: 1000, transformStyle: "preserve-3d" }}
      >
        {/* Scan line */}
        <div className="scan-line" />

        {/* Grid overlay */}
        <div className="absolute inset-0 grid-bg-fine opacity-30" />

        {/* Camera icon */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Camera className="w-16 h-16 text-secondary" />
          </motion.div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Circle className="w-2 h-2 fill-primary text-primary animate-pulse-glow" />
            <span>REC</span>
            <Wifi className="w-3 h-3 text-secondary" />
            <span>2.4GHz</span>
          </div>
        </div>

        {/* Corner markers */}
        {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map((pos, i) => (
          <div key={i} className={`absolute ${pos} w-4 h-4 border-primary/40 ${
            i === 0 ? "border-t-2 border-l-2" :
            i === 1 ? "border-t-2 border-r-2" :
            i === 2 ? "border-b-2 border-l-2" :
            "border-b-2 border-r-2"
          }`} />
        ))}
      </motion.div>
    </motion.div>
  );
};
