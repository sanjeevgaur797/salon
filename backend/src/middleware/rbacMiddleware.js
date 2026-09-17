/**
 * Middleware to restrict route access by role
 * @param  {...string} roles Allowed roles (e.g. 'SUPER_ADMIN', 'SALON_OWNER', 'RECEPTIONIST', 'STAFF')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'FORBIDDEN', 
        message: `Role '${req.user.role}' is not authorized to perform this action.` 
      });
    }

    next();
  };
};

module.exports = { authorize };
