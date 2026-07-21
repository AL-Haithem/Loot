import express from "express"

import {MainPageController,SingleAppDetails} from "../Controllers/Games/DataCon.js"

// VALIDATORS //
import InputValidator from "../Validators/Manager.js"
import {Validate} from "../Middleware/Validator.js"

const router = express.Router()

router.get("/games",Validate(InputValidator.GamesQuerySchema,"query"),MainPageController)
router.get("/games/:appid",Validate(InputValidator.GameAppIdSchema,"params"),SingleAppDetails)

export default router

