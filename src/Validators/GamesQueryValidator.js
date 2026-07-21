import Joi from "joi"

export const GamesQuerySchema = Joi.object({

   page: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(1)
    .messages({
      "number.base": "Page must be a number",
      "number.integer": "Page must be an integer",
      "number.min": "Page value must be at least 1",
      "number.max": "Page value is too large , max 100"
    }),

  filter: Joi.string()
    .valid(
      "popular",
      "recent",
      "lowest",
      "free",
      "paid"
    )
    .default("popular")
    .messages({"any.only": "Invalid filter"})
})

export const GameAppIdSchema = Joi.object({
  appid: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "number.base": "Invalid app id",
      "number.integer": "Invalid app id",
      "number.positive": "Invalid app id",
      "any.required": "Invalid app id"
    })
})