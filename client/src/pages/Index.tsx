import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Phone, Mail, MapPin, ExternalLink, Map } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HeroBadge } from "@/components/hero/HeroBadge";
import { ParallaxCamera } from "@/components/hero/ParallaxCamera";
import { InfiniteMarquee } from "@/components/hero/InfiniteMarquee";
import { StatsSection } from "@/components/hero/StatsSection";
import { ServicesSection } from "@/components/hero/ServicesSection";
import { FeaturedProducts } from "@/components/hero/FeaturedProducts";
import { TestimonialsSection } from "@/components/hero/TestimonialsSection";
import { WhyChooseUs } from "@/components/hero/WhyChooseUs";
import { FAQSection } from "@/components/hero/FAQSection";
import { CTABanner } from "@/components/hero/CTABanner";
import { useSettings } from "@/contexts/SettingsContext";

const Index = () => {
  const { settings } = useSettings();
  
  // Dynamic values fallback
  const displayPhone = settings?.phone || "+91 98120 19772";
  const displayEmail = settings?.email || "drishtisecuritysystem@gmail.com";
  const rawPhone = displayPhone.replace(/[^0-9+]/g, '');

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center relative overflow-hidden pt-16">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center lg:text-left">
            <HeroBadge />
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-4xl md:text-5xl lg:text-6xl font-bold mt-8 leading-tight">
              Enterprise-Grade <span className="text-gradient-amber">Security</span> Solutions
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="text-muted-foreground text-lg mt-6 max-w-xl mx-auto lg:mx-0">
              Professional CCTV, access control, and smart surveillance systems. Trusted by businesses and homeowners across India.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 }} className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start">
              <Link to="/store" data-clickable>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-amber font-semibold">
                  Browse Products <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/contact" data-clickable>
                <Button size="lg" variant="outline" className="border-border/60 hover:bg-muted/50">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Get Free Consultation
                </Button>
              </Link>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.4 }} className="flex-shrink-0">
            <ParallaxCamera />
          </motion.div>
        </div>
      </section>

      <div className="border-y border-border/30 py-4 space-y-2 overflow-hidden">
        <InfiniteMarquee direction="left" />
        <InfiniteMarquee direction="right" />
      </div>

      <StatsSection />
      <FeaturedProducts />
      <ServicesSection />
      <WhyChooseUs />
      <TestimonialsSection />
      <FAQSection />
      <CTABanner />

      {/* 🚀 ENTERPRISE FOOTER WITH GOOGLE MAPS LINK */}
      <footer className="bg-card/40 border-t border-border/40 pt-16 pb-8 px-4 mt-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 mb-16">
            
            {/* Brand Column */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2 group w-fit" data-clickable>
                <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-all">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <span className="font-bold text-xl tracking-tight">
                  <span className="text-primary">Drishti</span>
                  <span className="text-muted-foreground ml-1 font-light">Security</span>
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Enterprise-grade CCTV, access control, and smart surveillance systems. Protecting homes and businesses with cutting-edge technology and reliable support.
              </p>
            </div>

            {/* Quick Links Column */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link to="/store" className="hover:text-primary transition-colors inline-block" data-clickable>Security Store</Link></li>
                <li><Link to="/kit-builder" className="hover:text-primary transition-colors inline-block" data-clickable>Custom Kit Builder</Link></li>
                <li><Link to="/warranty" className="hover:text-primary transition-colors inline-block" data-clickable>Warranty & Support</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors inline-block" data-clickable>Book Consultation</Link></li>
              </ul>
            </div>

            {/* Contact Info Column */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">Contact Us</h4>
              <ul className="space-y-5 text-sm text-muted-foreground">
                <li>
                  <a href={`tel:${rawPhone}`} className="flex items-center gap-3 hover:text-primary transition-colors group" data-clickable>
                    <div className="w-8 h-8 rounded-full bg-muted/50 border border-border/40 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium">{displayPhone}</span>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${displayEmail}`} className="flex items-center gap-3 hover:text-primary transition-colors group" data-clickable>
                    <div className="w-8 h-8 rounded-full bg-muted/50 border border-border/40 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all shrink-0">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium">{displayEmail}</span>
                  </a>
                </li>
                
                {/* 📍 SMART GOOGLE MAPS LINK */}
                {settings?.address && (
                  <li className="flex items-start gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-muted/50 border border-border/40 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all shrink-0 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col items-start gap-2 mt-1.5">
                      <span className="leading-relaxed">{settings.address}</span>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1.5 rounded-full transition-colors mt-1"
                        data-clickable
                      >
                        <Map className="w-3 h-3" /> Get Directions <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>
                  </li>
                )}
              </ul>
            </div>

          </div>

          <div className="pt-6 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-muted-foreground/80">
            <p>© {new Date().getFullYear()} Drishti Security Systems. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-primary transition-colors cursor-pointer" data-clickable>Privacy Policy</span>
              <span className="hover:text-primary transition-colors cursor-pointer" data-clickable>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;