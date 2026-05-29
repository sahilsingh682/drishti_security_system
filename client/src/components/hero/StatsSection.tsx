import { motion } from "framer-motion";
import { Shield, Users, Camera, Award } from "lucide-react";

const stats = [
  { icon: Shield, value: "500+", label: "Installations", color: "text-primary" },
  { icon: Users, value: "1000+", label: "Happy Clients", color: "text-secondary" },
  { icon: Camera, value: "5000+", label: "Cameras Deployed", color: "text-primary" },
  { icon: Award, value: "10+", label: "Years Experience", color: "text-secondary" },
];

export const StatsSection = () => (
  <section className="py-20 px-4">
    <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className="glass-card p-6 text-center group hover:neon-border-amber transition-all duration-300"
        >
          <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color} group-hover:scale-110 transition-transform`} />
          <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
          <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  </section>
);
