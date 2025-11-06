/**
* ==================================================
* MIGRATION: add_admin_rls_policies
* ==================================================
*
* This migration file accomplishes two critical tasks:
* 1.  It enables Row-Level Security (RLS) on the `profiles` table, which is essential for locking down data access by default.
* 2.  It creates a specific, permissive policy named `"Admins can manage profiles"` that grants full CRUD (CREATE, READ, UPDATE, DELETE) access
*     to the `profiles` table *only* for users whose role is 'Admin'.
*
* WHY THIS IS SECURE:
* - Default Deny: With RLS enabled, all access is denied unless a policy explicitly grants it.
* - Role-Based Check: The policy checks the `role` of the *currently authenticated user* by calling a custom `get_my_claim('role')` function (assuming this function is defined elsewhere to read JWT claims).
* - Admin Supremacy: This ensures that only Admins can create, view, modify, or delete staff accounts (Teachers, Security), which is the core requirement for the Admin User Management module.
*/

-- 1. Enable Row-Level Security on the 'profiles' table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policy with the same name to ensure this migration is re-runnable
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;

-- 3. Create the policy granting Admins full CRUD access to the profiles table
CREATE POLICY "Admins can manage profiles" ON public.profiles
FOR ALL
-- The policy applies to all command types: SELECT, INSERT, UPDATE, DELETE
TO authenticated
-- This policy applies to any user who is logged in (authenticated)
USING (
  -- The USING clause is evaluated for SELECT, UPDATE, and DELETE operations.
  -- It checks if the logged-in user's role is 'Admin'. If true, they can see/modify all rows.
  (SELECT auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'Admin'))
)
WITH CHECK (
  -- The WITH CHECK clause is evaluated for INSERT and UPDATE operations.
  -- It ensures that any attempt to create or modify a user can only be done by an Admin.
  (SELECT auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'Admin'))
);
