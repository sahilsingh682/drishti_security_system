
CREATE POLICY "Admins can delete orders" ON public.orders
FOR DELETE USING (has_role(auth.uid(), 'Admin'::app_role) OR has_role(auth.uid(), 'SuperAdmin'::app_role));
