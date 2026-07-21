import Joi from "joi"

export const RedisStatsSchema = Joi.object({
  target: Joi.string()
    .valid(
      "overview",
      "usage",
      "traffic",
      "cache",
      "database",
      "commands"
    )
    .optional()
    .messages({
      "any.only": "Invalid target",
      "string.base": "Invalid target"
    })
})