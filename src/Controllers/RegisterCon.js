import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import ms from "ms"

import UserSchema from "../Config/Models/UserSchema.js"
import { CreateCsrfToken } from "../Middleware/CSRF.js"

const jwtExpireTime = process.env.JWT_EXPIRE_TIME || "15d"
const cookieMaxAge = ms(jwtExpireTime) || 1296000000


export async function RegisterController(req,res,next){
  try { const {username, email , password} = req.validatedReq 

    if(req.cookies?.access_token) {return res.status(401).json({message:"ALREADY_LOGGED_IN"})}
    
    // UserCheck //

    const CheckFindUser = await UserSchema.findOne({email})
    if (CheckFindUser) { return res.status(400).send("Wrong informations")} 

    // Pass Hashing //
    const HachedPassword = await bcrypt.hash(password, 10)

    const FindUser = await UserSchema.create({
      username: username,
      email: email,
      password: HachedPassword
    })

    // Create Token // 
    const JTI = crypto.randomBytes(32).toString("hex")

    const token = jwt.sign(
      {UserId: FindUser._id,
        type:"access",
        role:FindUser.rl,
        TokenVersion: FindUser.TokenVersion || 0,
        jti: JTI
      },
      process.env.JWT_SECRET,
      {expiresIn : jwtExpireTime}
    )

    res.cookie("access_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: cookieMaxAge,
      path: "/"
    })

    const csrfToken = CreateCsrfToken(JTI)
  
    return res.status(200).json({
      message:"Registered succesfully!",
      csrfToken
    })    
    console.log(3)
  } catch (error) { return next(error) }
}
