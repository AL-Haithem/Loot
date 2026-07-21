import jwt from "jsonwebtoken"
import UserSchema from "../../Config/Models/UserSchema.js"

const Link = process.env.LINK || "http://localhost:"

export async function GuestOnly(req,res,next){
  try {

  const origin = req.headers.origin
  if (origin && origin !== Link) { return res.sendStatus(403) }

  return next()
    const token = req.cookies?.access_token
     if (!token || typeof token !== "string" || token.length > 2000) { return next()}

    const decoded = jwt.verify(token,process.env.JWT_SECRET)
    if (
      decoded.type !== "access" ||
      !decoded.UserId ||
      decoded.TokenVersion === undefined ||
      !decoded.jti
    ) {return next()} 
    
    const FindUser = await UserSchema.findById(decoded.UserId).select("+IsBanned +IsActive +TokenVersion")

    if (
      !FindUser ||
      FindUser.IsActive === false ||
      FindUser.IsBanned === true ||
      decoded.TokenVersion !== FindUser.TokenVersion
    ) {return next()}

    return res.status(401).json({message: "ALREADY_LOGGED_IN"})

  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError" || error.name === "NotBeforeError") { return next()}
    return next(error)
  }
}
