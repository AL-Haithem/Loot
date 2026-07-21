const requiredEnvVars = [
  
  "LINK", // 1
  "BRAND_NAME", // 2
  "DBURL", // 3
  "COOKIE_SECRET", // 4
  "CSRF_SECRET", // 5
  "JWT_SECRET", // 6
  "JWT_EXPIRE_TIME", // 7
  "NODE_ENV", // 8
  "APP_MODE", // 9
  "RESEND_API_KEY", // 10
  "EMAIL_FROM", // 11

  "UPSTASH_REDIS_REST_URL", // 12 
  "UPSTASH_REDIS_REST_TOKEN", // 13
  "UPSTASH_DATABASE_ID", // 14
  "UPSTASH_EMAIL", // 15
  "UPSTASH_API_KEY", // 16
]

export function validateEnv() {
  const missing = requiredEnvVars.filter((name) => !process.env[name])

  if (missing.length > 0) {throw new Error(`Missing required environment variables: ${missing.join(", ")}`)}
}
