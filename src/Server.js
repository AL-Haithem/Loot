import "dotenv/config"

// =========== Libs Imports =========== //
import express from "express"
import rateLimiting from "express-rate-limit"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import compression from "compression"
import hpp from "hpp"
import morgan from "morgan"
import path from "path"
import { fileURLToPath } from "url"
// =============== End ================= //

// =========== Custom Imports =========== //
import DBModule from "./Controllers/Connections/DatabaseCon.js"
import {RedisConnection} from "./Controllers/Connections/RedisCon.js"
import AuthModule from "./Routes/Auth.js"
import PublicModule from "./Routes/Public.js"
import AdminModule from "./Routes/Admin.js"
import {PublicLimit} from "./Config/RateLimiting.js"
import {validateEnv} from "./Config/Env.js"
// =============== End ================= //

validateEnv()

const backPort = process.env.PORT || 2222
const FrontLink = process.env.LINK
const appMode = process.env.APP_MODE

let corsOps

if (appMode === "monolith") { corsOps = { origin: true,credentials: true}}
else {
  corsOps = {
    origin: FrontLink,
    credentials: true,
    allowedHeaders: ["Content-Type", "X-CSRF-Token"]
  }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let clientDistPath 
if (appMode === "monolith") { path.resolve(__dirname, "../../Client/dist") }

const app = express()

app.set("trust proxy", 1)
app.use(morgan("dev"))

app.use(helmet())
app.use(cors(corsOps))
app.use(hpp())
app.use(compression())
app.use(express.json({limit:"1mb"})) 
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(rateLimiting(PublicLimit))

app.use("/api/auth",AuthModule)
app.use("/api/public",PublicModule)
app.use("/api/vv/adm",AdminModule)

if (appMode === "monolith") {app.use(express.static(clientDistPath))}

// need this to prevent sending index.html in not existing api calls
app.use("/api", (req, res) => {return res.status(200).json({ message: "API route not found" })})
app.use("/", (req, res) => {return res.status(200).json({ message: "API route not found" })})

if (appMode  === "monolith") {
  app.use((req,res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {return res.status(404).json({message: "Route not found"})}
    return res.sendFile(path.join(clientDistPath, "index.html"))
  })
}

app.use((err, req, res, next) => { 
  console.log("---------> ERROR Handler | "+err)
  if (res.headersSent) { return next(err)}
  // log err.message feature
  return res.status(err.status || 500).json({ message: "Internal server error" })
})

app.listen(backPort, async () => {
  try {
    const DBsig = await DBModule.DBConnect()
    if (DBsig) {
     // await ServerModule.Start()

      await RedisConnection.set("Cach", "Cached")
      const Cach = await RedisConnection.get("Cach")
      console.log(`---------> DataBase Connected | Server is Running on Port : ${backPort}`)
      console.log(`---------> Redis Connected | First Cach is : ${Cach}`)
    }
    else {
      console.log(`---------> DataBase Connection Failed ):`)
      process.exit(1)
    }
  } catch (error) { console.log("---------> Connections ERROR : " + error) }
})
