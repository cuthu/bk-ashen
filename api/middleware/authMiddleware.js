const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('find-config')('.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/**
 * ==================================================
 * AUTH MIDDLEWARE
 * ==================================================
 * This middleware is the security guard for our API routes.
 * It verifies the user's JWT and checks their role.
 */

const isAdmin = async (req, res, next) => {
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
      return res.status(403).json({ error: 'Forbidden: User profile not found.' });
    }

    // 3. Enforce the 'Admin' role
    if (profile.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden: You do not have Admin privileges.' });
    }

    // If all checks pass, add the user to the request object and proceed
    req.user = user;
    next();

  } catch (error) {
    res.status(500).json({ error: `Authentication Error: ${error.message}` });
  }
};

module.exports = { isAdmin };