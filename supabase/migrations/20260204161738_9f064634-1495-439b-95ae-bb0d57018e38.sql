-- Grant Schemes Table - stores all Malta Enterprise grant schemes
CREATE TABLE public.grant_schemes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheme_name TEXT NOT NULL,
  scheme_code TEXT UNIQUE,
  description TEXT,
  
  -- Investment thresholds (hard filters)
  min_investment_required NUMERIC DEFAULT 0,
  max_investment_allowed NUMERIC,
  max_grant_amount NUMERIC,
  
  -- Aid framework
  aid_framework TEXT, -- 'De minimis', 'GBER', etc.
  
  -- Aid intensities for different scenarios
  standard_aid_intensity NUMERIC DEFAULT 0.5,
  sme_aid_intensity NUMERIC,
  sme_gozo_aid_intensity NUMERIC,
  large_entity_aid_intensity NUMERIC,
  large_entity_gozo_aid_intensity NUMERIC,
  hospitality_aid_intensity NUMERIC,
  startup_aid_intensity NUMERIC,
  
  -- Eligibility requirements
  startup_required BOOLEAN DEFAULT false,
  micro_only BOOLEAN DEFAULT false,
  sme_only BOOLEAN DEFAULT false,
  
  -- Grant type
  is_refundable_grant BOOLEAN DEFAULT false,
  is_cash_grant BOOLEAN DEFAULT true,
  is_tax_credit BOOLEAN DEFAULT false,
  
  -- Eligible NACE codes (array of NACE code strings)
  eligible_nace_codes TEXT[],
  
  -- Eligible activities (array of activity strings)
  eligible_activities TEXT[],
  
  -- Eligible cost categories (JSONB for flexibility)
  eligible_costs JSONB DEFAULT '{}'::JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Eligibility Assessments Table - stores user submissions
CREATE TABLE public.eligibility_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Business basics
  business_name TEXT,
  registration_status TEXT NOT NULL DEFAULT 'yes',
  business_size TEXT NOT NULL, -- 'micro', 'small', 'medium', 'large'
  business_age TEXT NOT NULL, -- 'startup', 'established'
  employee_count INTEGER DEFAULT 0,
  
  -- Industry
  primary_nace_code TEXT,
  
  -- Project activities
  primary_activity TEXT,
  sub_activity TEXT,
  
  -- Location
  project_location TEXT NOT NULL DEFAULT 'malta', -- 'malta', 'gozo'
  
  -- Costs stored as JSONB
  project_costs JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- Calculated totals
  total_capex NUMERIC DEFAULT 0,
  total_opex NUMERIC DEFAULT 0,
  total_project_value NUMERIC DEFAULT 0,
  
  -- Contact info (optional)
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  gdpr_consent BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Eligibility Results Table - stores matching results for each assessment
CREATE TABLE public.eligibility_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.eligibility_assessments(id) ON DELETE CASCADE,
  grant_scheme_id UUID NOT NULL REFERENCES public.grant_schemes(id) ON DELETE CASCADE,
  
  is_eligible BOOLEAN NOT NULL DEFAULT false,
  match_score INTEGER DEFAULT 0, -- 0-100
  applicable_aid_intensity NUMERIC,
  estimated_max_grant NUMERIC,
  matched_costs TEXT[],
  notes TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_grant_schemes_active ON public.grant_schemes(is_active);
CREATE INDEX idx_grant_schemes_min_investment ON public.grant_schemes(min_investment_required);
CREATE INDEX idx_assessments_created ON public.eligibility_assessments(created_at DESC);
CREATE INDEX idx_results_assessment ON public.eligibility_results(assessment_id);

-- Enable RLS
ALTER TABLE public.grant_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eligibility_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eligibility_results ENABLE ROW LEVEL SECURITY;

-- Grant schemes are publicly readable (reference data)
CREATE POLICY "Grant schemes are publicly readable"
  ON public.grant_schemes
  FOR SELECT
  USING (true);

-- Assessments are publicly insertable (anonymous users can submit)
CREATE POLICY "Anyone can create assessments"
  ON public.eligibility_assessments
  FOR INSERT
  WITH CHECK (true);

-- Anyone can read assessments (for now - can be restricted later)
CREATE POLICY "Anyone can read assessments"
  ON public.eligibility_assessments
  FOR SELECT
  USING (true);

-- Results follow assessment policies
CREATE POLICY "Anyone can read results"
  ON public.eligibility_results
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create results"
  ON public.eligibility_results
  FOR INSERT
  WITH CHECK (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_grant_schemes_updated_at
  BEFORE UPDATE ON public.grant_schemes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_eligibility_assessments_updated_at
  BEFORE UPDATE ON public.eligibility_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial grant schemes based on Excel data
INSERT INTO public.grant_schemes (
  scheme_name, scheme_code, description, min_investment_required, max_grant_amount,
  aid_framework, standard_aid_intensity, sme_gozo_aid_intensity, 
  micro_only, sme_only, startup_required,
  eligible_costs
) VALUES
(
  'Digitalise your Micro Business', 'DIGI-MICRO',
  'Grant for micro enterprises to adopt digital solutions including hardware, software, and cloud computing.',
  0, 10000, 'De minimis', 0.50, 0.60,
  true, false, false,
  '{"hardware_software": true, "digital_tools": true}'::JSONB
),
(
  'Digitalise your SME', 'DIGI-SME',
  'Comprehensive digital transformation support for SMEs including advanced digital tools and AI solutions.',
  10000, 128400, 'De minimis', 0.50, 0.60,
  false, true, false,
  '{"hardware_software": true, "digital_tools": true, "installation_training": true}'::JSONB
),
(
  'Business Development', 'BIZ-DEV',
  'Support for business expansion, equipment acquisition, and operational improvements.',
  0, 300000, 'GBER', 0.75, null,
  false, false, false,
  '{"premises_lease": true, "construction": true, "equipment_machinery": true, "wages": true, "vehicles": true, "specialized_services": true}'::JSONB
),
(
  'Invest 2024', 'INVEST-2024',
  'Major investment scheme for significant capital projects exceeding €1 million.',
  1000000, 15000000, 'GBER', 0.20, 0.30,
  false, false, false,
  '{"land_building": true, "premises_lease": true, "construction": true, "equipment_machinery": true, "wages": true, "vehicles": true, "specialized_services": true}'::JSONB
),
(
  'Start-up Finance', 'STARTUP',
  'Refundable grant support for innovative startups with strong growth potential.',
  500000, 1500000, 'GBER Art. 22', 0.75, null,
  false, true, true,
  '{"wages": true, "equipment_machinery": true, "specialized_services": true, "premises_lease": true, "incorporation": true}'::JSONB
),
(
  'SME Enhance', 'SME-ENHANCE',
  'Equipment and machinery grants for SME growth and modernisation.',
  10000, 128000, 'GBER', 0.60, 0.70,
  false, true, false,
  '{"equipment_machinery": true, "furniture_fixtures": true, "vehicles": true, "premises_lease": true}'::JSONB
),
(
  'Business Reports for SMEs', 'BIZ-REPORTS',
  'Lump sum grant for external consultancy services for business planning.',
  0, 4000, 'De minimis', 0.80, null,
  false, true, false,
  '{"professional_fees": true}'::JSONB
),
(
  'Feasibility Study Scheme', 'FEASIBILITY',
  'Support for feasibility studies to evaluate project and business idea potential.',
  0, 100000, 'GBER', 0.70, 0.70,
  false, true, false,
  '{"rd_expertise": true, "professional_fees": true}'::JSONB
);