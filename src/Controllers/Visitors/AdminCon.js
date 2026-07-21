import {DataPolicy} from "../../Config/Policies/DataPolicy.js"
import {RedisData} from "../Connections/RedisCon.js"

async function GetDashData(req,res,next){
  try { 
    const resolvedData = req.Already 
    const canAccess = DataPolicy.canReadAdminDashboardData(resolvedData)
    if (!canAccess) {return res.sendStatus(403)}

    const data = {Timer : new Date(),}
    if (!data) {return res.sendStatus(403)}

    return res.status(200).json(data)
  } catch (error) { next(error) }
}

async function GetRedisData(req,res,next){

  try { 
    const resolvedData = req.Already
    const param = req.validatedReq ?? "none"

    const canAccess = DataPolicy.canReadAdminRedisData(resolvedData)
    if (!canAccess || !param) {return res.sendStatus(403)}

    const data =  await RedisData(param)
    if (!data) {return res.sendStatus(403)}

    return res.status(200).json(data)
  } catch (error) { next(error) }
}

export default {
  GetDashData,
  GetRedisData
}