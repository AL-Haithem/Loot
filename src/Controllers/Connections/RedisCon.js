import { Redis } from '@upstash/redis'
import axios from "axios"

const RedisConnection = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
})

async function GetRedisStats() {

  try {
    const response = await axios.get(
      `https://api.upstash.com/v2/redis/stats/${process.env.UPSTASH_DATABASE_ID}`,
      {
        auth: {
          username: process.env.UPSTASH_EMAIL,
          password: process.env.UPSTASH_API_KEY
        }
      }
    )
    return response.data
  } catch (error) { console.log("---------> RedisStats ERROR : " + error)}
}

async function RedisData(target) {

  try {
    let FinalData

    const response = await GetRedisStats()

    switch (target) {

      case "overview":
        return {
          current_storage: response.current_storage,
          total_monthly_storage: response.total_monthly_storage,
          total_monthly_bandwidth: response.total_monthly_bandwidth,
          total_monthly_requests: response.total_monthly_requests,
          dailyrequests: response.dailyrequests,
          dailybilling: response.dailybilling
        }

      case "usage":
        return {
          diskusage: response.diskusage,
          dailybandwidth: response.dailybandwidth,
          dailyrequests: response.dailyrequests
        }

      case "traffic":
        return {
          daily_read_requests: response.daily_read_requests,
          daily_write_requests: response.daily_write_requests,
          total_monthly_read_requests: response.total_monthly_read_requests,
          total_monthly_write_requests: response.total_monthly_write_requests
        }

      case "cache":
        return {
          hits: response.hits,
          misses: response.misses,
          read: response.read,
          write: response.write
        }

      case "database":
        return {
          keyspace: response.keyspace,
          connection_count: response.connection_count,
          rest_conn_count: response.rest_conn_count
        }

      case "commands":
        return {
          daily_net_commands: response.daily_net_commands,
          command_counts: response.command_counts
        }

      default: return response
    }

  } catch (error) { console.log("---------> RedisStats ERROR : " + error)}

}

export {
  RedisConnection,
  GetRedisStats,
  RedisData
}