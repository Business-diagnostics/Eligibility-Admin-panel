
-- Add supported_sub_activities to grant_schemes
ALTER TABLE public.grant_schemes ADD COLUMN IF NOT EXISTS supported_sub_activities text[] DEFAULT NULL;

-- Add allowed_registration_statuses to grant_schemes
ALTER TABLE public.grant_schemes ADD COLUMN IF NOT EXISTS allowed_registration_statuses text[] DEFAULT NULL;
