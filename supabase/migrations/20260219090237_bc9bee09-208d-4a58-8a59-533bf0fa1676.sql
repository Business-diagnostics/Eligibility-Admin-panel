
-- Fix PUBLIC_DATA_EXPOSURE: Replace the open SELECT policy on eligibility_assessments
-- The assessments table is used for anonymous calculations; contact details live in leads (already protected)
-- We restrict SELECT to only authenticated users (admins), since public users only need to INSERT
DROP POLICY IF EXISTS "Anyone can read assessments" ON public.eligibility_assessments;

CREATE POLICY "Authenticated users can read assessments"
ON public.eligibility_assessments
FOR SELECT
USING (auth.uid() IS NOT NULL);
