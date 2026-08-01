

exports.requireAuth =(req,res,next)=>{
  if(!req.session.userId){
    return res.statsus(401).json({message:"Unauthorized"});
  }
  next();
}