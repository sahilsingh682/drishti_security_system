import { Camera, Shield, Eye, Lock, Wifi, Radio, Server, MonitorSmartphone } from "lucide-react";

const icons = [Camera, Shield, Eye, Lock, Wifi, Radio, Server, MonitorSmartphone];
const labels = ["CCTV Systems", "Access Control", "Surveillance AI", "Cyber Security", "IoT Sensors", "Communication", "NVR/DVR", "Smart Home"];

interface MarqueeRowProps {
  direction: "left" | "right";
}

export const InfiniteMarquee = ({ direction }: MarqueeRowProps) => {
  const items = [...labels, ...labels, ...labels, ...labels];
  const iconSet = [...icons, ...icons, ...icons, ...icons];

  return (
    <div className="overflow-hidden py-3">
      <div className={direction === "left" ? "animate-marquee-left" : "animate-marquee-right"} style={{ display: "flex", width: "max-content" }}>
        {items.map((label, i) => {
          const Icon = iconSet[i % icons.length];
          return (
            <div
              key={i}
              className="flex items-center gap-2 px-6 py-2.5 mx-2 glass-card rounded-lg whitespace-nowrap"
            >
              <Icon className="w-4 h-4 text-primary/70" />
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
