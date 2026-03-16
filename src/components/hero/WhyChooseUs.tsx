import { motion } from "framer-motion";
import { ShieldCheck, Clock, Award, Headphones, Truck, Wrench } from "lucide-react";

const reasons = [
  {
    icon: ShieldCheck,
    title: "Genuine Products",
    desc: "100% authorized dealer for top brands like Hikvision, Dahua, and CP Plus.",
  },
  {
    icon: Wrench,
    title: "Expert Installation",
    desc: "Certified technicians with 10+ years of field experience across Haryana.",
  },
  {
    icon: Clock,
    title: "24/7 Monitoring Support",
    desc: "Round-the-clock remote assistance and rapid on-site response when you need it.",
  },
  {
    icon: Award,
    title: "Warranty Backed",
    desc: "Up to 3-year warranty on all products with hassle-free replacement policy.",
  },
  {
    icon: Truck,
    title: "Fast Delivery & Setup",
    desc: "Same-day delivery in Hisar and 48-hour setup guarantee across the state.",
  },
  {
    icon: Headphones,
    title: "Dedicated AMC Plans",
    desc: "Annual maintenance contracts to keep your systems running at peak performance.",
  },
];

export const WhyChooseUs = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">
            Why Drishti
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">
            Why Choose Us
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            We don't just sell cameras — we deliver complete security solutions you can trust.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reasons.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 100 }}
              className="group relative rounded-2xl border border-border/30 bg-card p-6 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1.5">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
