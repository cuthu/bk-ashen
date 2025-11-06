const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('find-config')('.env') });

// Use the Service Role Key to allow the middleware to bypass RLS and read user roles.
// This is secure because this code only runs on your trusted server.
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * ==================================================
 * GENERIC ROLE-CHECKING MIDDLEWARE (FACTORY)
 * ==================================================
 */
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Expecting "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }

    try {
      // 1. Verify the token to get the user
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
      }

      // 2. Check the user's role in the 'profiles' table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        // This is the error the user was seeing. It happens when the middleware
        // doesn't have permission to read the profiles table.
        return res.status(403).json({ error: 'Forbidden: User profile not found.' });
      }

      // 3. Enforce the allowed roles
      if (!allowedRoles.includes(profile.role)) {
        return res.status(403).json({ error: `Forbidden: Access denied. Required roles: ${allowedRoles.join(', ')}` });
      }

      // If all checks pass, add the user to the request object and proceed
      req.user = user;
      next();

    } catch (error) {
      res.status(500).json({ error: `Authentication Error: ${error.message}` });
    }
  };
};

/**
 * ==================================================
 * CONVENIENCE MIDDLEWARE
 * ==================================================
 */
const isAdmin = checkRole(['Admin']);
const isSecurity = checkRole(['Security']);
const isAdminOrSecurity = checkRole(['Admin', 'Security']);

module.exports = { 
  checkRole,
  isAdmin,
  isSecurity,
  isAdminOrSecurity
};