import { RegisterSchema,LoginSchema,ForgotPasswordSchema } from "./AuthValidator.js"
import { GamesQuerySchema,GameAppIdSchema } from "./GamesQueryValidator.js"
import { RedisStatsSchema } from "./AdminValidator.js"

export default {
  LoginSchema,
  RegisterSchema,
  ForgotPasswordSchema,
  GamesQuerySchema,
  GameAppIdSchema,
  RedisStatsSchema,
}