
-- Drop existing policies first to ensure the script is re-runnable
DROP POLICY IF EXISTS "Admins can manage all early departures" ON public.early_departures;
DROP POLICY IF EXISTS "Security can view all early departures" ON public.early_departures;
DROP POLICY IF EXISTS "Security can check out students" ON public.early_departures;

-- Enable RLS for the early_departures table
ALTER TABLE public.early_departures ENABLE ROW LEVEL SECURITY;

-- 1. Admins have full control over early departures
CREATE POLICY "Admins can manage all early departures"
  ON public.early_departures FOR ALL
  USING (get_user_role() = 'Admin');

-- 2. Security can view all early departure records
CREATE POLICY "Security can view all early departures"
  ON public.early_departures FOR SELECT
  USING (get_user_role() = 'Security');

-- 3. Security can update records to mark them as 'Checked-Out'
CREATE POLICY "Security can check out students"
  ON public.early_departures FOR UPDATE
  USING (get_user_role() = 'Security')
  WITH CHECK (
    -- This check ensures that when a security guard updates a record,
    -- they are setting the status to 'Checked-Out' and recording their own ID.
    status = 'Checked-Out' AND
    checked_out_by_profile_id = auth.uid()
  );

