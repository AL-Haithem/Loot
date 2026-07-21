export const DataPolicy = {

  canReadAdminDashboardData(user) { 
    if(!user) {return false}
    return ['admin'].includes(user.rl)
  },

  canReadAdminRedisData(user) { 
    if(!user) {return false}
    return ['admin'].includes(user.rl)
  },
}