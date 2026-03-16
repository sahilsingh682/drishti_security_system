
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Anyone can read visible testimonials
CREATE POLICY "Anyone can view visible testimonials"
ON public.testimonials FOR SELECT
USING (is_visible = true);

-- Admins can do everything
CREATE POLICY "Admins can manage testimonials"
ON public.testimonials FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'Admin'::app_role) OR has_role(auth.uid(), 'SuperAdmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'Admin'::app_role) OR has_role(auth.uid(), 'SuperAdmin'::app_role));

-- Seed initial data
INSERT INTO public.testimonials (name, role, text, rating, sort_order) VALUES
('Rajesh Kumar', 'Business Owner, Hisar', 'Drishti Security installed a complete CCTV setup at my factory. Crystal clear footage and excellent after-sales support. Highly recommended!', 5, 1),
('Priya Sharma', 'Homeowner, Gurgaon', 'Very professional team. They helped me choose the right cameras for my home and completed installation in just one day. Feeling much safer now.', 5, 2),
('Amit Verma', 'School Administrator, Rohtak', 'We needed 32 cameras across our campus. Drishti delivered on time, within budget, and the remote monitoring works flawlessly.', 4, 3),
('Sunita Devi', 'Shop Owner, Bhiwani', 'Affordable pricing and genuine products. The night vision quality is amazing. Their warranty support gives me peace of mind.', 5, 4);
