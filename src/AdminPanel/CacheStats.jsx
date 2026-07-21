import { useState, useEffect } from 'react'
import { API_BASE } from '../api.js'
import { csrfStore } from '../csrfStore.js'
import { useToast } from './Toast.jsx'

export default function CacheStats({ isActive }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const fetchCacheStats = async () => {
    try {
      setLoading(true)
      // Sending GET request without body to get the full fallback payload from RedisCon.js
      const res = await fetch(`${API_BASE}/api/vv/adm/dashboard/cach`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfStore.get() || ''
        }
      })
      
      if (!res.ok) throw new Error('Failed to fetch cache stats')
      const jsonData = await res.json()
      setData(jsonData)
    } catch (err) {
      console.error(err)
      showToast('Error loading cache stats', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isActive && !data && !loading) {
      fetchCacheStats()
    }
  }, [isActive])

  if (!isActive) return null

  return (
    <div className="section active">
      <div className="section-header">
        <h2>
          <i className="fas fa-server"></i>
          Redis Cache Statistics
          <span className="subtitle">Real-time memory and traffic statistics for the Redis server</span>
        </h2>
        <button className="btn btn-outline" onClick={fetchCacheStats} disabled={loading}>
          <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i> 
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {!data && loading && <div className="loading-shimmer">Loading cache data...</div>}
      {!data && !loading && <div className="settings-message error" style={{position:'static', transform:'none', margin:'20px 0'}}>No data available. Try refreshing.</div>}

      {data && (
        <>
          {/* Section 1 & 2: Overview and Usage */}
          <div className="dashboard-grid">
            <div className="card-glass dashboard-group">
              <div className="group-title">
                <i className="fas fa-chart-pie"></i> Overview
              </div>
              <div className="stats-mini-grid">
                <StatCard label="Current Storage" value={extractValue(data.current_storage, true)} />
                <StatCard label="Monthly Storage" value={extractValue(data.total_monthly_storage, true)} />
                <StatCard label="Monthly Bandwidth" value={extractValue(data.total_monthly_bandwidth, true)} />
                <StatCard label="Monthly Requests" value={extractValue(data.total_monthly_requests)} />
                <StatCard label="Daily Requests" value={extractSum(data.dailyrequests)} />
                <StatCard label="Daily Billing" value={'$' + extractSum(data.dailybilling)} />
              </div>
            </div>

            <div className="card-glass dashboard-group">
              <div className="group-title">
                <i className="fas fa-hdd"></i> Usage
              </div>
              <div className="stats-mini-grid">
                <StatCard label="Disk Usage" value={extractValue(data.diskusage, true)} />
                <StatCard label="Daily Bandwidth" value={extractValue(data.dailybandwidth, true)} />
                <StatCard label="Daily Requests" value={extractSum(data.dailyrequests)} />
              </div>
            </div>
          </div>

          {/* Section 3 & 4: Traffic and Cache */}
          <div className="dashboard-grid">
            <div className="card-glass dashboard-group">
              <div className="group-title">
                <i className="fas fa-exchange-alt"></i> Traffic
              </div>
              <div className="stats-mini-grid">
                <StatCard label="Daily Read Req." value={extractValue(data.daily_read_requests)} />
                <StatCard label="Daily Write Req." value={extractValue(data.daily_write_requests)} />
                <StatCard label="Monthly Read Req." value={extractValue(data.total_monthly_read_requests)} />
                <StatCard label="Monthly Write Req." value={extractValue(data.total_monthly_write_requests)} />
              </div>
            </div>

            <div className="card-glass dashboard-group">
              <div className="group-title">
                <i className="fas fa-bolt"></i> Cache Hit Rates (Latest)
              </div>
              <div className="stats-mini-grid">
                <StatCard label="Hits/sec" value={extractValue(data.hits)} />
                <StatCard label="Misses/sec" value={extractValue(data.misses)} />
                <StatCard label="Reads/sec" value={extractValue(data.read)} />
                <StatCard label="Writes/sec" value={extractValue(data.write)} />
              </div>
            </div>
          </div>

          {/* Section 5 & 6: Database and Commands */}
          <div className="dashboard-grid">
            <div className="card-glass dashboard-group">
              <div className="group-title">
                <i className="fas fa-database"></i> Database Keys
              </div>
              <div className="stats-mini-grid">
                <StatCard label="Keyspace" value={extractValue(data.keyspace)} />
                <StatCard label="Active Connections" value={extractValue(data.connection_count)} />
                <StatCard label="REST Connections" value={extractValue(data.rest_conn_count)} />
              </div>
            </div>

            <div className="card-glass dashboard-group">
              <div className="group-title">
                <i className="fas fa-terminal"></i> Commands
              </div>
              <div className="stats-mini-grid" style={{ gridTemplateColumns: '1fr' }}>
                <StatCard label="Daily Net Commands" value={extractValue(data.daily_net_commands)} />
                
                {Array.isArray(data.command_counts) && data.command_counts.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <div className="group-title" style={{ fontSize: '0.85rem', marginBottom: '8px', borderBottom: 'none' }}>Command Breakdown (Latest Rate)</div>
                    <div className="stats-mini-grid">
                      {data.command_counts.map((cmdObj, i) => (
                        <div key={i} className="stat-card-modern">
                          <span className="label" style={{ textTransform: 'uppercase' }}>{cmdObj.metric_identifier || 'CMD'}</span>
                          <span className="value" style={{ fontSize: '1rem' }}>{extractValue(cmdObj.data_points)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────
// Extracts the latest 'y' value from Upstash time-series array, or formats a plain number
function extractValue(val, isBytes = false) {
  let num = 0
  if (typeof val === 'number') {
    num = val
  } else if (Array.isArray(val) && val.length > 0) {
    const last = val[val.length - 1]
    if (last && typeof last.y === 'number') num = last.y
  } else if (typeof val === 'string') {
    num = parseFloat(val) || 0
  }

  if (isBytes) {
    if (num === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(num) / Math.log(k))
    return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return Number.isInteger(num) ? num.toString() : parseFloat(num.toFixed(2)).toString()
}

// Sums all 'y' values in an Upstash time-series array
function extractSum(val) {
  if (typeof val === 'number') return val.toString()
  if (!Array.isArray(val)) return '0'
  const sum = val.reduce((acc, curr) => acc + (curr.y || 0), 0)
  return Number.isInteger(sum) ? sum.toString() : parseFloat(sum.toFixed(2)).toString()
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card-modern">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  )
}
