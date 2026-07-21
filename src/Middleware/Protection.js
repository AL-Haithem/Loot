import jwt from "jsonwebtoken"

import UserSchema from "../Config/Models/UserSchema.js"

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/"
}

const Link = process.env.LINK

function Unauthorized(res) {
  res.clearCookie("access_token", cookieOptions)
  return res.sendStatus(401)
}

export async function Protection(req,res,next) {

  try {

    const origin = req.headers.origin
    if (origin && origin !== Link) { return res.sendStatus(403) }

    const token = req.cookies?.access_token
    if (!token || token.length > 2000) { return res.sendStatus(401)}

    const decoded = jwt.verify(token,process.env.JWT_SECRET)
    if (
      decoded.type !== "access" ||
      !decoded.UserId ||
      decoded.TokenVersion === undefined ||
      !decoded.jti
    ) { return Unauthorized(res)}

    const FindUser = await UserSchema.findById(decoded.UserId).select("+PassChangedAt +IsBanned +IsActive +rl +TokenVersion")
    if (!FindUser || FindUser.IsActive === false || FindUser.IsBanned === true || decoded.TokenVersion !== FindUser.TokenVersion ) { return Unauthorized(res) }

    if (FindUser.PassChangedAt) { 
      const NewDate = new Date(FindUser.PassChangedAt)
      const DateNumber = NewDate.getTime()
      
      if (Number.isNaN(DateNumber)) { return Unauthorized(res) }
      
      const PassDate = Math.floor(DateNumber / 1000) 

      // password changed after token created
      if (PassDate > decoded.iat) {return Unauthorized(res)} 
    }
    
    req.Already = FindUser
    req.AuthToken = {jti: decoded.jti}

    return next()

  } catch (error) {
    if (error.name === "TokenExpiredError"||error.name === "JsonWebTokenError") { return Unauthorized(res) }
    return next(error)
  }
}
