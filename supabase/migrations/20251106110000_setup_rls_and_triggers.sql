-- 1. FUNCTION & TRIGGER TO SYNC PROFILE
-- This trigger automatically creates a profile entry when a new user signs up.
-- It defaults their role to 'Teacher', which an Admin can change later.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'Teacher');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. HELPER FUNCTION TO GET USER ROLE
-- This makes it easy to check a user's role in RLS policies.
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  ELSE
    RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.late_arrivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.early_departures ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES

-- PROFILES
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (get_user_role() = 'Admin');
CREATE POLICY "Users can view and edit their own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- CLASSES
CREATE POLICY "Admins can manage all classes" ON public.classes FOR ALL USING (get_user_role() = 'Admin');
CREATE POLICY "Teachers can view classes" ON public.classes FOR SELECT USING (get_user_role() = 'Teacher');

-- STUDENTS
CREATE POLICY "Admins can manage all students" ON public.students FOR ALL USING (get_user_role() = 'Admin');
CREATE POLICY "Teachers can view active students" ON public.students FOR SELECT USING (get_user_role() = 'Teacher' AND is_active = TRUE);

-- LATE ARRIVALS
CREATE POLICY "Admins can manage all late arrivals" ON public.late_arrivals FOR ALL USING (get_user_role() = 'Admin');
CREATE POLICY "Teachers can create late arrivals" ON public.late_arrivals FOR INSERT WITH CHECK (get_user_role() = 'Teacher' AND recorded_by_profile_id = auth.uid());
CREATE POLICY "Teachers can view all late arrivals" ON public.late_arrivals FOR SELECT USING (get_user_role() = 'Teacher');

-- EARLY DEPARTURES
CREATE POLICY "Admins can manage all early departures" ON public.early_departures FOR ALL USING (get_user_role() = 'Admin');
CREATE POLICY "Security can view today's approved departures" ON public.early_departures FOR SELECT USING (get_user_role() = 'Security' AND status = 'Approved' AND planned_departure_time::date = now()::date);
CREATE POLICY "Security can check-out students" ON public.early_departures FOR UPDATE USING (get_user_role() = 'Security' AND status = 'Approved') WITH CHECK (status = 'Checked-Out' AND checked_out_by_profile_id = auth.uid());

-- Finally, create a default DENY policy as a security best practice.
-- If none of the above policies match, the action is blocked.
CREATE POLICY "Deny all other actions" ON public.profiles FOR ALL USING (FALSE);
CREATE POLICY "Deny all other actions" ON public.classes FOR ALL USING (FALSE);
CREATE POLICY "Deny all other actions" ON public.students FOR ALL USING (FALSE);
CREATE POLICY "Deny all other actions" ON public.late_arrivals FOR ALL USING (FALSE);
CREATE POLICY "Deny all other actions" ON public.early_departures FOR ALL USING (FALSE);
