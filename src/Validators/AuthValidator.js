import Joi from "joi"

export const RegisterSchema = Joi.object({

    username: Joi.string().trim().min(4).max(16)
    .messages({
    "string.base": "Username Format is not valid",
    "string.empty": "Username Cannot be empty",
    "string.min": "Username Must be at least 4 characters",
    "string.max": "Username Cannot exceed 16 characters",
    "any.required": "Username Is required"
    }),

    email: Joi.string().trim().lowercase().email().required()
    .messages({
      "string.base": "Email Format is not valid",
      "string.empty": "Email Cannot be empty",
      "string.email": "Email Please enter a valid email address",
      "any.required": "Email Is required"
    }),

    password: Joi.string().trim().min(6).max(16).required()
    .messages({
      "string.base": "Password Format is not valid",
      "string.empty": "Password Cannot be empty",
      "string.min": "Password Must be at least 6 characters",
      "string.max": "Password Cannot exceed 16 characters",
      "any.required": "Password Is required"
    }),
})

export const LoginSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().required()
    .messages({
      "string.base": "Email format is not valid",
      "string.empty": "Email cannot be empty",
      "string.email": "Please enter a valid email address",
      "any.required": "Email is required"
    }),

    password: Joi.string().trim().min(6).max(16).required()
    .messages({
      "string.base": "Password format is not valid",
      "string.empty": "Password cannot be empty",
      "string.min": "Password must be at least 6 characters",
      "string.max": "Password cannot exceed 16 characters",
      "any.required": "Password is required"
    }),
})

export const ForgotPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required()
    .messages({
      "string.base": "Email format is not valid",
      "string.empty": "Email cannot be empty",
      "string.email": "Please enter a valid email address",
      "any.required": "Email is required"
    }),
  newPassword: Joi.string().trim().min(6).max(16).required()
    .messages({
      "string.base": "NewPassword format is not valid",
      "string.empty": "NewPassword cannot be empty",
      "string.min": "NewPassword must be at least 6 characters",
      "string.max": "NewPassword cannot exceed 16 characters",
      "any.required": "NewPassword is required"
    }),
  confirmNewPassword: Joi.string().trim().valid(Joi.ref("newPassword")).required()
    .messages({
      "string.base": "Confirm New Password format is not valid",
      "string.empty": "Confirm New Password cannot be empty",
      "any.only": "Passwords do not match",
      "any.required": "Confirm New Password is required"
    }), 
  code: Joi.string().trim().pattern(/^\d{6}$/).required()
    .messages({
      "string.pattern.base": "Code must be exactly 6 digits",
      "string.empty": "Code is required",
      "any.required": "Code is required"
    }),           
})