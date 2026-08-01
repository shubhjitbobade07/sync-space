

exports.requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.session.role; // Assuming the user's role is stored in the session
        if(!userRole){
            return  res.status(401).json({ message: 'Unauthorized' });
        }
        if(!allowedRoles.includes(userRole)){
            return  res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
}