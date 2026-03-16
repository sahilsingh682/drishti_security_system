
CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Public read for visible FAQs
CREATE POLICY "Anyone can view visible faqs"
ON public.faqs FOR SELECT
USING (is_visible = true);

-- Admins can manage
CREATE POLICY "Admins can manage faqs"
ON public.faqs FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'Admin'::app_role) OR has_role(auth.uid(), 'SuperAdmin'::app_role))
WITH CHECK (has_role(auth.uid(), 'Admin'::app_role) OR has_role(auth.uid(), 'SuperAdmin'::app_role));

-- Seed data
INSERT INTO public.faqs (question, answer, sort_order) VALUES
('What brands do you deal in?', 'We are authorized dealers for Hikvision, Dahua, CP Plus, Uniview, and other leading security brands. All products come with manufacturer warranty.', 1),
('Do you provide installation services?', 'Yes! We offer end-to-end professional installation by certified technicians with 10+ years of experience. Installation charges depend on the scope of work and are quoted upfront.', 2),
('What areas do you serve?', 'We serve all of Haryana with primary operations in Hisar, Gurgaon, Rohtak, Bhiwani, and surrounding districts. For large projects, we cover Pan-India.', 3),
('How does the warranty work?', 'All products carry a standard 1–3 year warranty depending on the brand. We handle all warranty claims in-house so you don''t have to deal with the manufacturer directly.', 4),
('Can I monitor my cameras remotely?', 'Absolutely. We set up remote viewing on your phone, tablet, and computer at no extra cost. You can watch live footage from anywhere in the world.', 5),
('Do you offer AMC (Annual Maintenance Contracts)?', 'Yes, we offer flexible AMC plans that include periodic check-ups, cleaning, firmware updates, and priority support. Plans start at ₹2,000/year.', 6);
