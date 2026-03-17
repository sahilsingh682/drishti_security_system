import { motion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";

export const CTABanner = () => {
  const { settings } = useSettings();
  
  // Dynamic phone values
  const displayPhone = settings?.phone || "+91 98120 19772";
  const rawPhone = displayPhone.replace(/[^0-9+]/g, ''); // Removes spaces for the tel: link

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden border border-border/30 bg-card p-10 md:p-16 text-center"
        >
          {/* Ambient glows */}
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <span className="text-sm font-semibold text-primary uppercase tracking-widest">
              Get Started Today
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 max-w-2xl mx-auto leading-tight">
              Secure Your Property with a{" "}
              <span className="text-gradient-amber">Free Consultation</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
              Our experts will assess your security needs and recommend the best
              solution — absolutely free, no obligations.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
              <Link to="/contact" data-clickable>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-amber font-semibold">
                  Book Free Consultation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href={`tel:${rawPhone}`} data-clickable>
                <Button size="lg" variant="outline" className="border-border/60 hover:bg-muted/50">
                  <Phone className="w-4 h-4 mr-2" />
                  Call {displayPhone}
                </Button>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};