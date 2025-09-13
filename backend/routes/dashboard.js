const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/', authMiddleware, (req, res) => {
    res.json({ 
        msg: "Welcome to your dashboard!",
        user: {
            _id: req.user._id,
            username: req.user.name,
            email: req.user.email
        }
    });
});

module.exports = router;