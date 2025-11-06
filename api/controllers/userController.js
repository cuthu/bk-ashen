const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('find-config')('.env') });

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * ==================================================
 * USER CONTROLLER
 * ==================================================
 * This controller handles all the business logic for the Admin User Management module.
 * It uses the `SUPABASE_SERVICE_ROLE_KEY` to perform privileged operations.
 * IMPORTANT: These functions should only be callable by routes protected by the `isAdmin` middleware.
 */

// Controller function to create a new user
const createUser = async (req, res) => {
  const { email, password, full_name, role } = req.body;

  // Basic validation
  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ error: 'Missing required fields: email, password, full_name, role.' });
  }

  try {
    // Step 1: Create the user in the Auth system
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm the email for simplicity
    });

    if (authError) {
      throw new Error(`Auth Error: ${authError.message}`);
    }

    const user = authData.user;

    // Step 2: Add the user's profile and role to the 'profiles' table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        full_name: full_name,
        role: role,
      }]);

    if (profileError) {
      // If creating the profile fails, we should roll back by deleting the auth user
      await supabase.auth.admin.deleteUser(user.id);
      throw new Error(`Profile Error: ${profileError.message}`);
    }

    res.status(201).json({ message: 'User created successfully', user: user });

  } catch (error) {
    res.status(500).json({ error: `Failed to create user: ${error.message}` });
  }
};

// Controller function to get all users
const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at');

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: `Failed to retrieve users: ${error.message}` });
  }
};

// Controller function to update a user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { full_name, role } = req.body;

  if (!full_name && !role) {
    return res.status(400).json({ error: 'No fields to update. Provide full_name or role.' });
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name, role })
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }
    if (data.length === 0) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully', user: data[0] });
  } catch (error) {
    res.status(500).json({ error: `Failed to update user: ${error.message}` });
  }
};

// Controller function to delete a user
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Using the admin client to delete the user from the auth schema
    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      // If the user does not exist in auth, it might have been already deleted.
      // We can proceed to ensure the profile is also deleted.
      if (error.message !== 'User not found') {
          throw error;
      }
    }
    
    // The profile record is deleted automatically by a trigger in Supabase if it exists.
    res.status(200).json({ message: 'User deleted successfully' });

  } catch (error) {
    res.status(500).json({ error: `Failed to delete user: ${error.message}` });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,
};