import { motion } from "framer-motion";
import { Camera, Shield, Wifi, Server, Lock, Eye } from "lucide-react";

const services = [
  { icon: Camera, title: "CCTV Installation", desc: "HD & IP camera systems with professional setup and configuration." },
  { icon: Shield, title: "Access Control", desc: "Biometric, RFID, and smart lock systems for premises security." },
  { icon: Wifi, title: "Networking", desc: "Enterprise-grade networking for seamless surveillance connectivity." },
  { icon: Server, title: "DVR/NVR Systems", desc: "High-capacity recording solutions with cloud backup options." },
  { icon: Lock, title: "Alarm Systems", desc: "Intrusion detection and perimeter security alarm installations." },
  { icon: Eye, title: "Remote Monitoring", desc: "24/7 remote access and mobile monitoring setup." },
];

export const ServicesSection = () => (
  <section className="py-20 px-4 relative">
    <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <span className="text-xs font-mono tracking-[0.3em] text-primary uppercase">What We Offer</span>
        <h2 className="text-3xl md:text-4xl font-bold mt-3">
          Our <span className="text-gradient-amber">Services</span>
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service, i) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="glass-card-hover p-6 group"
          >
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
              <service.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
