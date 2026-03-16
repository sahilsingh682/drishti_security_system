import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Phone, Mail } from "lucide-react";
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

const Index = () => {
  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center relative overflow-hidden pt-16">
        {/* Ambient glows */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 text-center lg:text-left">
            <HeroBadge />

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mt-8 leading-tight"
            >
              Enterprise-Grade{" "}
              <span className="text-gradient-amber">Security</span>{" "}
              Solutions
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-muted-foreground text-lg mt-6 max-w-xl mx-auto lg:mx-0"
            >
              Professional CCTV, access control, and smart surveillance systems.
              Trusted by businesses and homeowners across India.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start"
            >
              <Link to="/store" data-clickable>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-amber font-semibold">
                  Browse Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/contact" data-clickable>
                <Button size="lg" variant="outline" className="border-border/60 hover:bg-muted/50">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Get Free Consultation
                </Button>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex-shrink-0"
          >
            <ParallaxCamera />
          </motion.div>
        </div>
      </section>

      {/* Marquee */}
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

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© 2026 Drishti Security Systems. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <a href="tel:+919812019772" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Phone className="w-3.5 h-3.5" /> +91 98120 19772
            </a>
            <a href="mailto:drishtisecuritysystem@gmail.com" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Mail className="w-3.5 h-3.5" /> drishtisecuritysystem@gmail.com
            </a>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
            <Link to="/warranty" className="hover:text-primary transition-colors">Warranty</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
