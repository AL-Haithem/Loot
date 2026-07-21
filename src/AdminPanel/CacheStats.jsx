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
                <StatCard label="Current Storage" value={data.current_storage ?? '0'} />
                <StatCard label="Monthly Storage" value={data.total_monthly_storage ?? '0'} />
                <StatCard label="Monthly Bandwidth" value={data.total_monthly_bandwidth ?? '0'} />
                <StatCard label="Monthly Requests" value={data.total_monthly_requests ?? '0'} />
                <StatCard label="Daily Requests" value={data.dailyrequests ?? '0'} />
                <StatCard label="Daily Billing" value={data.dailybilling ?? '$0.00'} />
              </div>
            </div>

            <div className="card-glass dashboard-group">
              <div className="group-title">
                <i className="fas fa-hdd"></i> Usage
              </div>
              <div className="stats-mini-grid">
                <StatCard label="Disk Usage" value={data.diskusage ?? '0'} />
                <StatCard label="Daily Bandwidth" value={data.dailybandwidth ?? '0'} />
                <StatCard label="Daily Requests" value={data.dailyrequests ?? '0'} />
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
                <StatCard label="Daily Read Req." value={data.daily_read_requests ?? '0'} />
                <StatCard label="Daily Write Req." value={data.daily_write_requests ?? '0'} />
                <StatCard label="Monthly Read Req." value={data.total_monthly_read_requests ?? '0'} />
                <StatCard label="Monthly Write Req." value={data.total_monthly_write_requests ?? '0'} />
              </div>
            </div>

            <div className="card-glass dashboard-group">
              <div className="group-title">
                <i className="fas fa-bolt"></i> Cache Hits & Misses
              </div>
              <div className="stats-mini-grid">
                <StatCard label="Hits" value={data.hits ?? '0'} />
                <StatCard label="Misses" value={data.misses ?? '0'} />
                <StatCard label="Read Operations" value={data.read ?? '0'} />
                <StatCard label="Write Operations" value={data.write ?? '0'} />
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
                <StatCard label="Keyspace" value={data.keyspace ?? '0'} />
                <StatCard label="Active Connections" value={data.connection_count ?? '0'} />
                <StatCard label="REST Connections" value={data.rest_conn_count ?? '0'} />
              </div>
            </div>

            <div className="card-glass dashboard-group">
              <div className="group-title">
                <i className="fas fa-terminal"></i> Commands
              </div>
              <div className="stats-mini-grid" style={{ gridTemplateColumns: '1fr' }}>
                <StatCard label="Daily Net Commands" value={data.daily_net_commands ?? '0'} />
                
                {data.command_counts && typeof data.command_counts === 'object' && (
                  <div style={{ marginTop: '10px' }}>
                    <div className="group-title" style={{ fontSize: '0.85rem', marginBottom: '8px', borderBottom: 'none' }}>Command Breakdown</div>
                    <div className="stats-mini-grid">
                      {Object.entries(data.command_counts).map(([cmd, count]) => (
                        <div key={cmd} className="stat-card-modern">
                          <span className="label" style={{ textTransform: 'uppercase' }}>{cmd}</span>
                          <span className="value" style={{ fontSize: '1rem' }}>{count}</span>
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

function StatCard({ label, value }) {
  return (
    <div className="stat-card-modern">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  )
}
