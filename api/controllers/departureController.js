const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('find-config')('.env') });

// IMPORTANT: Use the service role key for backend operations
// to bypass RLS policies where necessary (e.g., fetching user roles).
// The actual security is enforced by our middleware and database RLS policies.
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * ==================================================
 * DEPARTURE CONTROLLER
 * ==================================================
 */

/**
 * ADMIN: Create a new early departure record.
 * The record is automatically set to 'Approved'.
 */
const createDeparture = async (req, res) => {
    const { student_id, reason } = req.body;

    if (!student_id || !reason) {
        return res.status(400).json({ error: 'student_id and reason are required fields.' });
    }

    try {
        const { data, error } = await supabase
            .from('early_departures')
            .insert({
                student_id,
                reason,
                status: 'Approved', // Status is 'Approved' by default when an Admin creates it
                approved_by_profile_id: req.user.id, // The ID of the authenticated Admin from the middleware
            })
            .select()
            .single(); // Return the created object

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: `Failed to create departure record: ${error.message}` });
    }
};

/**
 * SECURITY & ADMIN: Get a list of all departures for the current day
 * that are still in 'Approved' status (i.e., not yet checked out).
 */
const getTodayDepartures = async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10); // Gets YYYY-MM-DD

        const { data, error } = await supabase
            .from('early_departures')
            .select(`
                id, created_at, reason, status,
                students ( id, first_name, last_name, grade ),
                approved_by:approved_by_profile_id ( id, first_name, last_name )
            `)
            .eq('status', 'Approved')
            .gte('created_at', `${today}T00:00:00.000Z`) // Start of today
            .lte('created_at', `${today}T23:59:59.999Z`) // End of today
            .order('created_at', { ascending: true });

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: `Failed to fetch today\'s departures: ${error.message}` });
    }
};

/**
 * SECURITY: Mark an 'Approved' departure as 'Checked-Out'.
 * This is the action performed at the gate.
 */
const checkoutDeparture = async (req, res) => {
    const { id } = req.params; // The ID of the early_departures record

    try {
        // The RLS policy for 'Security' already ensures they can ONLY update records.
        // We add a specific check here to make sure we don't update an already processed record.
        const { data, error } = await supabase
            .from('early_departures')
            .update({
                status: 'Checked-Out',
                checked_out_at: new Date().toISOString(),
                checked_out_by_profile_id: req.user.id, // The ID of the authenticated Security guard
            })
            .eq('id', id)
            .eq('status', 'Approved') // Critical check: Only act on approved records
            .select()
            .single();

        if (error) throw error;

        // If data is null, it means the record was not found OR its status was not 'Approved'.
        if (!data) {
            return res.status(404).json({ error: 'Approved departure record not found or it has already been processed.' });
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: `Failed to check out departure: ${error.message}` });
    }
};

/**
 * ADMIN: Get a complete history of all departure records for auditing.
 */
const getAllDepartures = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('early_departures')
            .select(`
                id, created_at, reason, status, checked_out_at,
                students ( id, first_name, last_name, grade ),
                approved_by:approved_by_profile_id ( id, first_name, last_name ),
                checked_out_by:checked_out_by_profile_id ( id, first_name, last_name )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: `Failed to fetch all departure records: ${error.message}` });
    }
};

module.exports = {
    createDeparture,
    getTodayDepartures,
    checkoutDeparture,
    getAllDepartures
};