
-- Add legal_structure column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS legal_structure text DEFAULT 'limited_company';

-- Add allowed_legal_structures column to grant_schemes table
-- This is a text array of allowed structures: 'self_employed', 'partnership', 'limited_company'
-- NULL or empty array means ALL structures are allowed
ALTER TABLE public.grant_schemes ADD COLUMN IF NOT EXISTS allowed_legal_structures text[] DEFAULT NULL;
