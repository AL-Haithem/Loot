import crypto from "crypto"

function createHmacSignature(jti,randomValue) {
  return crypto
    .createHmac("sha256",process.env.CSRF_SECRET)
    .update(`${jti.lenght}!${jti}!${randomValue.lenght}!${randomValue}`)
    .digest("hex")
}

function TimingSafeEqualHex(a,b) {

  if(typeof a !== "string" || typeof b !== "string") {return false}

  if (!/^[a-f0-9]{64}$/i.test(a)) {return false}
  if (!/^[a-f0-9]{64}$/i.test(b)) {return false}

  const aBuffer = Buffer.from(a, "hex")
  const bBuffer = Buffer.from(b, "hex")

  if (aBuffer.length !== bBuffer.length) {return false}

  return crypto.timingSafeEqual(aBuffer,bBuffer)
}

export function CreateCsrfToken(jti) {

  if (!jti || typeof jti !== "string") {
    throw new Error("Missing Session Id For CSRF Token")
  }

  const RandomValue = crypto.randomBytes(32).toString("hex")
  const Signature = createHmacSignature(jti, RandomValue)

  return `${Signature}.${RandomValue}`
}

export function VerifyCsrfToken(jti,token) {

  if (!jti || typeof jti !== "string") {return false}
  if (!token || typeof token !== "string") {return false}

  const parts = token.split(".")
  if (parts.length !== 2) {return false}

  const [SignatureFromClient ,RandomValue] = parts

  if (!SignatureFromClient || !RandomValue) {return false}
  if (!/^[a-f0-9]{64}$/i.test(RandomValue)) {return false}

  const ExpectedSignature = createHmacSignature(jti, RandomValue)

  return TimingSafeEqualHex(SignatureFromClient,ExpectedSignature)
}

export function RequireCsrf(req,res,next) {

  const csrfToken = req.headers["x-csrf-token"]

  if (!req.AuthToken?.jti) {return res.status(401).json({message: "ALREADY_LOGGED_OUT"})}
  
  if (!VerifyCsrfToken(req.AuthToken.jti,csrfToken)) {return res.status(403).json({message: "csrf"})}

  return next()
}