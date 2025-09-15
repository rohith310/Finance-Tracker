const express = require('express');
const { getUserProfile, updateUserProfile, deleteUserAccount } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// GET /api/user/profile - Get user profile
router.get('/profile', getUserProfile);

// PUT /api/user/profile - Update user profile
router.put('/profile', updateUserProfile);

// DELETE /api/user/account - Delete user account
router.delete('/account', deleteUserAccount);

module.exports = router;
