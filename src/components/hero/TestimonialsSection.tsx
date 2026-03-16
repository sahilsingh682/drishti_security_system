import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
}

export const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("id, name, role, text, rating")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true })
        .limit(4);
      if (data) setTestimonials(data as Testimonial[]);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-56 rounded-2xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-muted/20">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Trusted by hundreds of businesses and homeowners across Haryana and beyond.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
              className="relative rounded-2xl border border-border/30 bg-card p-6 flex flex-col"
            >
              <Quote className="w-8 h-8 text-primary/15 absolute top-4 right-4" />

              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s < t.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/20"}`}
                  />
                ))}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                "{t.text}"
              </p>

              <div className="mt-5 pt-4 border-t border-border/30">
                <p className="font-semibold text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
