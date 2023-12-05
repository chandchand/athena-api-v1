// middlewares/permissionMiddleware.js
const checkPermission = (requiredRole) => {
    return (req, res, next) => {
      const user = req.user;
  
      if (!user || user.role !== requiredRole) {
        return res.status(403).json({ error: 'Anda tidak memiliki izin untuk akses ini.' });
      }
  
      next();
    };
  };
  
  module.exports = { checkPermission };
  