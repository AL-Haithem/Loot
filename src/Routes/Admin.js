import express from "express"
import rateLimit from "express-rate-limit"

import {Protection} from "../Middleware/Protection.js"
import InputValidator from "../Validators/Manager.js"
import {Validate} from "../Middleware/Validator.js"
import {AdminLoginLimit} from "../Config/RateLimiting.js"
import {LoginController} from "../Controllers/LoginCon.js"
import {GuestOnly} from "../Controllers/Visitors/GuestCon.js"
import AdminController from "../Controllers/Visitors/AdminCon.js"
import { RequireCsrf } from "../Middleware/CSRF.js"

const router = express.Router()

router.post("/login",rateLimit(AdminLoginLimit),GuestOnly,Validate(InputValidator.LoginSchema),LoginController)
router.get("/",Protection)
router.get("/dashboard",Protection,RequireCsrf,AdminController.GetDashData)
router.get("/dashboard/cach",Protection,RequireCsrf,Validate(InputValidator.RedisStatsSchema),AdminController.GetRedisData)
  
export default router