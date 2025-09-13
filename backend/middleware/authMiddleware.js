const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

        // Validate token format
        if (!token.startsWith('Bearer ')) {
            return res.status(401).json({ msg: 'Invalid token format' });
        }

        const actualToken = token.split(" ")[1];
        if (!actualToken) {
            return res.status(401).json({ msg: 'Invalid token format' });
        }

        console.log('Verifying token with secret:', process.env.JWT_SECRET ? 'Secret exists' : 'No secret');
        const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
        console.log('Token decoded successfully:', decoded);
        
        const user = await User.findById(decoded.userId).select("-password");
        
        if (!user) {
            return res.status(401).json({ msg: 'User not found' });
        }

        req.user = user;
        next();
    }
    catch(err){
        console.log('Auth error:', err.name, err.message);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ msg: 'Invalid token' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ msg: 'Token expired' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = authMiddleware;