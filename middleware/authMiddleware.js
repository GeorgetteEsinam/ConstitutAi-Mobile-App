const jwt = require('jsonwebtoken');

/**
 * protect – verifies the JWT in the Authorization header.
 * Attaches the decoded user payload to req.user on success.
 */
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authorised – no token provided' });
    }

    const token = authHeader.slice(7).trim();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Session expired – please log in again' });
        }
        return res.status(401).json({ error: 'Not authorised – token is invalid' });
    }
};

/**
 * restrictTo – role-based access control.
 * Usage: restrictTo('admin', 'author')
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden – you do not have permission' });
        }
        next();
    };
};

module.exports = { protect, restrictTo };
