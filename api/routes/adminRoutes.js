const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAdmin } = require('../middleware/authMiddleware');

// All these routes are protected and can only be accessed by an Admin

// POST /api/admin/users - Create a new staff member (Teacher or Security)
router.post('/users', isAdmin, userController.createUser);

// GET /api/admin/users - Get a list of all staff members
router.get('/users', isAdmin, userController.getAllUsers);

// PUT /api/admin/users/:id - Update a staff member's details
router.put('/users/:id', isAdmin, userController.updateUser);

// DELETE /api/admin/users/:id - Delete a staff member's account
router.delete('/users/:id', isAdmin, userController.deleteUser);

module.exports = router;