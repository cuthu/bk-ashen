const express = require('express');
const router = express.Router();
const { 
    createDeparture, 
    getTodayDepartures, 
    checkoutDeparture, 
    getAllDepartures 
} = require('../controllers/departureController');
const { isAdmin, isSecurity, isAdminOrSecurity } = require('../middleware/authMiddleware');

/**
 * ==================================================
 * EARLY DEPARTURE ROUTES
 * ==================================================
 */

// ADMIN: Create a new early departure record for a student.
router.post('/', isAdmin, createDeparture);

// ADMIN: Get a comprehensive list of all departure records.
router.get('/', isAdmin, getAllDepartures);

// SECURITY & ADMIN: Get a list of today's approved departures.
router.get('/today', isAdminOrSecurity, getTodayDepartures);

// SECURITY: Mark a student as 'Checked-Out' at the gate.
router.put('/:id/checkout', isSecurity, checkoutDeparture);

module.exports = router;
