-- Create admin_permissions table to track which pages each admin can access
CREATE TABLE public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, page_key)
);

-- Enable RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- SuperAdmins can manage all permissions
CREATE POLICY "SuperAdmins can manage permissions" ON public.admin_permissions
FOR ALL USING (has_role(auth.uid(), 'SuperAdmin'))
WITH CHECK (has_role(auth.uid(), 'SuperAdmin'));

-- Admins can view their own permissions
CREATE POLICY "Users can view own permissions" ON public.admin_permissions
FOR SELECT USING (auth.uid() = user_id);

-- Function to check if user has permission for a page
CREATE OR REPLACE FUNCTION public.has_page_permission(_user_id uuid, _page_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_permissions 
    WHERE user_id = _user_id AND page_key = _page_key
  )
$$;