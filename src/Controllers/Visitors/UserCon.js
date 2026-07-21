export async function NormalUserCon(req,res,next){
  try { 
    const resolvedData = req.Already


    const data = {
      username : resolvedData.Username,
      UserId : resolvedData.UserId
    }
    return res.status(200).json({data:data})
    
  } catch (error) { next(error) }
}