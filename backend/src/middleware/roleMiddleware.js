const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin only.' 
    });
  }
  next();
};

const isStaff = (req, res, next) => {
  if (req.user.role !== 'staff' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied.' 
    });
  }
  next();
};

module.exports = { isAdmin, isStaff };