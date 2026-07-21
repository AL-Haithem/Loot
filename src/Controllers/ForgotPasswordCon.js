import crypto from "crypto"
import bcrypt from "bcrypt"

import UserSchema from "../Config/Models/UserSchema.js"
import {sendEmail} from "../Utils/EmailSender.js"

const VerificationCodeAge = 10 * 60 * 1000 // 10 min

const ResetCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: VerificationCodeAge,
  secure: process.env.NODE_ENV === "production"
}

const ClearResetCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production"
}

const GenericResetResponse = {message: "If this email exists, a reset code was sent"}

export async function ForgotPasswordController(req,res,next){
  try { const {email} = req.validatedReq

    if (req.cookies?.access_token) {return res.status(401).json({message:"ALREADY_LOGGED_IN"})}

    const FindUser = await UserSchema.findOne({email}).select("+email +rl +IsBanned +IsActive")

    if (!FindUser || FindUser.IsActive === false || FindUser.IsBanned === true || FindUser.rl !== "user") {
      return res.status(200).json(GenericResetResponse)
    }
    
    const VerificationCode = crypto.randomInt(100000,1000000).toString() 
    const HashedCode = crypto.createHash("sha256").update(VerificationCode).digest("hex")

    const ResetReqId = crypto.randomBytes(32).toString("hex")
    const HashedResetReqId = crypto.createHash("sha256").update(ResetReqId).digest("hex")

    FindUser.PassResetCode = HashedCode
    FindUser.PassResetCodeExp = new Date(Date.now() + VerificationCodeAge)
    FindUser.PassResetAttempts = 0
    FindUser.PassResetReqId = HashedResetReqId

    await FindUser.save({ validateBeforeSave: false })

    const EmailMessage = `
    Your ${process.env.BRAND_NAME} password reset code

    Hi ${FindUser.username},

    We received a request to reset your ${process.env.BRAND_NAME} password. Please use the one-time verification code below:
    
    ${VerificationCode}
    
    This code will expire in [10] minutes. If you did not request this password reset, please ignore this email.
    
    
    Best regards,The ${process.env.BRAND_NAME} Team
    
    `

    try {
      await sendEmail({
        email: FindUser.email,
        subject: "Your password reset code is valid for 10 minutes",
        message: EmailMessage
      })
    } catch (emailError) {
      FindUser.PassResetCode = undefined
      FindUser.PassResetCodeExp = undefined
      FindUser.PassResetAttempts = 0  
      FindUser.PassResetReqId = undefined

      await FindUser.save({ validateBeforeSave: false })
      
      res.clearCookie("reset_request_id", ClearResetCookieOptions)
      return next(emailError)
    }

    res.cookie("reset_request_id", ResetReqId, ResetCookieOptions)
    return res.status(200).json(GenericResetResponse)
  } catch (error) {return next(error)}
}

export async function ConfirmForgotPasswordController(req,res,next){
  try { const {email , newPassword , confirmNewPassword , code} = req.validatedReq
   
    if (req.cookies?.access_token) {return res.status(401).json({message:"ALREADY_LOGGED_IN"})}
    if (newPassword !== confirmNewPassword ) {return res.status(400).json({message:"Passwords do not match"})}

    const ResetReqId = req.cookies?.reset_request_id
    if (!ResetReqId) {return res.status(400).json({message:"Reset session invalid or expired"})}
    const HashedResetReqId = crypto.createHash("sha256").update(ResetReqId).digest("hex")

   const FindUser = await UserSchema.findOne({email}).select("+rl +IsBanned +IsActive +PassResetCode +PassResetCodeExp +PassResetAttempts +PassResetReqId +TokenVersion")

    if (
        !FindUser ||
        FindUser.IsActive === false ||
        FindUser.IsBanned === true ||
        FindUser.rl !== "user" ||
        !FindUser.PassResetCode ||
        !FindUser.PassResetCodeExp ||
        !FindUser.PassResetReqId
      ) { return res.status(400).json({message:"Invalid or expired digits code"})}

    if (FindUser.PassResetReqId !== HashedResetReqId) {
      res.clearCookie("reset_request_id", ClearResetCookieOptions)
      return res.status(400).json({message:"Reset session expired"})
    } 

    if (FindUser.PassResetCodeExp < new Date()) { // CODE EXPIRED //
      
      FindUser.PassResetCode = undefined
      FindUser.PassResetCodeExp = undefined
      FindUser.PassResetAttempts = 0
      FindUser.PassResetReqId = undefined

      await FindUser.save({ validateBeforeSave: false })
      res.clearCookie("reset_request_id", ClearResetCookieOptions)
      return res.status(400).json({message:"Expired digits code"})
    }

    if (FindUser.PassResetAttempts >= 5) {

      FindUser.PassResetCode = undefined
      FindUser.PassResetCodeExp = undefined
      FindUser.PassResetAttempts = 0
      FindUser.PassResetReqId = undefined

      await FindUser.save({ validateBeforeSave: false })

      res.clearCookie("reset_request_id", ClearResetCookieOptions)
      return res.status(429).json({message:"Too many invalid attempts. Please request a new reset code"})
    }

    const HashedCode = crypto.createHash("sha256").update(code).digest("hex")
    if (HashedCode !== FindUser.PassResetCode) {

      FindUser.PassResetAttempts += 1

      if (FindUser.PassResetAttempts >= 5) {

        FindUser.PassResetCode = undefined
        FindUser.PassResetCodeExp = undefined
        FindUser.PassResetAttempts = 0
        FindUser.PassResetReqId = undefined

        await FindUser.save({ validateBeforeSave: false })

        res.clearCookie("reset_request_id", ClearResetCookieOptions)
        return res.status(429).json({message:"Too many invalid attempts. Please request a new reset code"})
      }

      await FindUser.save({ validateBeforeSave: false })
      return res.status(400).json({message:"Invalid or expired digits code"})
    }

    const HachedPassword = await bcrypt.hash(newPassword, 10)

    FindUser.password = HachedPassword
    FindUser.PassResetCode = undefined
    FindUser.PassResetCodeExp = undefined
    FindUser.PassResetAttempts = 0
    FindUser.PassResetReqId = undefined

    FindUser.PassChangedAt = new Date(Date.now() - 1000)
    FindUser.TokenVersion += 1

    await FindUser.save()

    res.clearCookie("reset_request_id", ClearResetCookieOptions)
    return res.status(200).json({message:"Password changed succesfully"})

  } catch (error) {return next(error)}
}
