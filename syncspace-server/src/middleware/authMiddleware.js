const jwt = require('jsonwebtoken');

exports.requireAuth =(req,res,next)=>{

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if(!token){
    return res.status(401).json({message:"Authentication required"});
  }
  jwt.verify(token,process.env.JWT_ACCESS_SECRET,(err,user)=>{
    if(err){
      return res.status(403).json({message:"Invalid or expired token"});
    }
    req.user = user; // { userId, role } — available to every controller from here on
    next();
  });
}