import express from "express"
import rateLimit from "express-rate-limit"
import Joi from "joi"

import InputValidator from "../Validators/Manager.js"
import {Validate} from "../Middleware/Validator.js"
import {LoginLimit,RegisterLimit,PublicLimit,ForgotPasswordLimit,ResetPasswordLimit,CsrfLimit} from "../Config/RateLimiting.js"
import {Protection} from "../Middleware/Protection.js"
import { CreateCsrfToken,RequireCsrf } from "../Middleware/CSRF.js"

import {LoginController} from "../Controllers/LoginCon.js"
import {LogoutController} from "../Controllers/LogoutCon.js"
import {RegisterController} from "../Controllers/RegisterCon.js"
import {ForgotPasswordController,ConfirmForgotPasswordController} from "../Controllers/ForgotPasswordCon.js"
import {NormalUserCon} from "../Controllers/Visitors/UserCon.js"
import {GuestOnly} from "../Controllers/Visitors/GuestCon.js"

const ForgotPasswordSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().required()
    .messages({
      "string.base": "Email format is not valid",
      "string.empty": "Email cannot be empty",
      "string.email": "Please enter a valid email address",
      "any.required": "Email is required"
    }),
})    

const router = express.Router()

router.post("/login",rateLimit(LoginLimit),GuestOnly,Validate(InputValidator.LoginSchema),LoginController)
router.post("/register",rateLimit(RegisterLimit),GuestOnly,Validate(InputValidator.RegisterSchema),RegisterController)
router.post("/forgot-password",rateLimit(ForgotPasswordLimit),GuestOnly,Validate(ForgotPasswordSchema),ForgotPasswordController)
router.post("/confirm-forgot-password",rateLimit(ResetPasswordLimit),GuestOnly,Validate(InputValidator.ForgotPasswordSchema),ConfirmForgotPasswordController)
router.post("/logout",Protection,RequireCsrf,LogoutController)

router.get("/check",rateLimit(CsrfLimit),Protection,NormalUserCon)

router.get("/csrf",Protection,(req,res)=> {
  const csrfToken = CreateCsrfToken(req.AuthToken.jti)
  return res.status(200).json({csrfToken})
})

export default router