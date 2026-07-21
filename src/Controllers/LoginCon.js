import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import ms from "ms"

import UserSchema from "../Config/Models/UserSchema.js"
import { CreateCsrfToken } from "../Middleware/CSRF.js"

const jwtExpireTime = process.env.JWT_EXPIRE_TIME || "15d"
const cookieMaxAge = ms(jwtExpireTime) || 1296000000

const DUMMY_HASH = await bcrypt.hash("dummy-password", 10)

export async function LoginController(req,res,next){
  try { const {email , password} = req.validatedReq

    let who
    if (req.cookies?.access_token) {return res.status(401).json({message:"ALREADY_LOGGED_IN"})}
    if (req.originalUrl === "/api/vv/adm/login") {who = "admin"} else {who = "user"}
    
    const FindUser = await UserSchema.findOne({email}).select("+password +rl +IsBanned +IsActive +TokenVersion")

    const hashToCompare = FindUser?.password || DUMMY_HASH
    const PassMatch = await bcrypt.compare(password, hashToCompare)

    const NotAllowedPath = who === "admin" && FindUser?.rl !== "admin"
    if (!FindUser || !PassMatch || FindUser.IsActive === false || FindUser.IsBanned === true || NotAllowedPath) {return res.status(401).send("Invalid Email or Password")}


    // Create Token // 
    const JTI = crypto.randomBytes(32).toString("hex")

    const token = jwt.sign(
      {UserId: FindUser._id,
        type:"access",
        role:FindUser.rl,
        TokenVersion: FindUser.TokenVersion || 0,
        jti: JTI
      },
      process.env.JWT_SECRET,{
      expiresIn : jwtExpireTime
    })

    res.cookie("access_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: cookieMaxAge,
      path: "/"
    })

    const csrfToken = CreateCsrfToken(JTI)

    return res.status(200).json({
      message:"Logged in succesfully!",
      csrfToken
    })

  } catch (error) { return next(error) }
}