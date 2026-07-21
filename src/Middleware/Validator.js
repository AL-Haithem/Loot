export function Validate(schema,source = "body") {
  return (req, res, next) => {

    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    req.validatedReq = value

    next()
  }
}
