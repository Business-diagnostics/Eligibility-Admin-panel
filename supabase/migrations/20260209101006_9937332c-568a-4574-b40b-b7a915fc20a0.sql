
-- Create leads table to store user submissions with all project data and results
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  business_name TEXT,
  business_size TEXT NOT NULL,
  business_age TEXT NOT NULL,
  employee_count INTEGER DEFAULT 0,
  annual_turnover NUMERIC DEFAULT 0,
  registration_status TEXT DEFAULT 'yes',
  project_location TEXT DEFAULT 'malta',
  primary_nace_code TEXT,
  primary_activity TEXT,
  sub_activity TEXT,
  has_exceeded_de_minimis BOOLEAN DEFAULT false,
  project_costs JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_capex NUMERIC DEFAULT 0,
  total_opex NUMERIC DEFAULT 0,
  total_project_value NUMERIC DEFAULT 0,
  -- Results data
  eligible_grants JSONB DEFAULT '[]'::jsonb,
  best_grant_name TEXT,
  best_grant_amount NUMERIC DEFAULT 0,
  best_aid_intensity NUMERIC DEFAULT 0,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anyone can create leads (public form submission)
CREATE POLICY "Anyone can create leads"
ON public.leads
FOR INSERT
WITH CHECK (true);

-- Only authenticated users (admin) can read leads
CREATE POLICY "Authenticated users can read leads"
ON public.leads
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only authenticated users can update leads
CREATE POLICY "Authenticated users can update leads"
ON public.leads
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to manage grant_schemes (admin)
CREATE POLICY "Authenticated users can update grant schemes"
ON public.grant_schemes
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert grant schemes"
ON public.grant_schemes
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete grant schemes"
ON public.grant_schemes
FOR DELETE
USING (auth.uid() IS NOT NULL);
