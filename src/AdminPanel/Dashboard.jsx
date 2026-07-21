// Dashboard section — adapted from Temp/Dashboard.jsx
// Uses API_BASE + csrfStore instead of BASE_URL from helpers
import { useState, useEffect, useRef } from 'react'
import { API_BASE } from '../api.js'
import { csrfStore } from '../csrfStore.js'

function sizeFormat(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i]
}

function timeFormat(ms) {
  if (!ms || ms < 0) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const hours   = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`
}

export default function Dashboard({ isActive }) {
  const [stats, setStats]   = useState(null)
  const [error, setError]   = useState(false)
  const [uptime, setUptime] = useState('00:00:00')
  const chartRef      = useRef(null)
  const chartInstance = useRef(null)

  const loadDashboardData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/vv/adm/dashboard`, {
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfStore.get() ?? '' },
      })
      if (!res.ok) throw new Error('Server ERROR')
      const data = await res.json()
      setStats(data)
      setError(false)
    } catch {
      setError(true)
    }
  }

  useEffect(() => {
    if (isActive) {
      loadDashboardData()
      const interval = setInterval(loadDashboardData, 5000)
      return () => clearInterval(interval)
    }
  }, [isActive])

  useEffect(() => {
    if (!stats?.ServerStartTime) return
    const interval = setInterval(() => {
      setUptime(timeFormat(Date.now() - stats.ServerStartTime))
    }, 1000)
    setUptime(timeFormat(Date.now() - stats.ServerStartTime))
    return () => clearInterval(interval)
  }, [stats?.ServerStartTime])

  useEffect(() => {
    if (stats?.chartData && chartRef.current && window.Chart) {
      if (chartInstance.current) {
        chartInstance.current.data = stats.chartData
        chartInstance.current.update()
      } else {
        chartInstance.current = new window.Chart(chartRef.current, {
          type: 'line',
          data: stats.chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
              x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
          }
        })
      }
    }
  }, [stats])

  const total       = stats?.TotalGames || 0
  const dataSize    = stats ? sizeFormat(stats.DBStorageSize) : '0 B'
  const startTimeStr = stats?.ServerStartTime ? new Date(stats.ServerStartTime).toLocaleString() : '--'

  return (
    <div id="dashboard" className={`section ${isActive ? 'active' : ''}`}>
      <div className="section-header">
        <h2>
          <i className="fas fa-home" /> Dashboard
          <span className="subtitle">نظرة عامة على النظام</span>
        </h2>
        <button className="btn btn-info btn-xs" onClick={loadDashboardData}>
          <i className="fas fa-sync-alt" /> تحديث
        </button>
      </div>

      <div className="dashboard-grid">
        {/* أداء الموارد والأجهزة */}
        <div className="dashboard-group stats-group-card card-glass">
          <h3 className="group-title"><i className="fas fa-microchip" /> أداء الموارد والأجهزة</h3>
          <div className="stats-mini-grid">
            {!stats ? (
              <div className="stat-placeholder">
                <i className="fas fa-spinner fa-pulse" /> جاري التحميل...
              </div>
            ) : (
              <>
                <div className="stat-card-modern" style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="label">CPU Usage:</span>
                    <span className="value">{stats.ServerHealth?.CPU || 0}%</span>
                  </div>
                  <div className="progress-mini" style={{ height: '6px', marginTop: '8px' }}>
                    <div className="progress-mini-fill" style={{ width: `${stats.ServerHealth?.CPU || 0}%`, background: 'var(--accent-clr)' }} />
                  </div>
                </div>

                <div className="stat-card-modern" style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="label">RAM Usage:</span>
                    <span className="value">{stats.ServerHealth?.RAM?.percent || 0}%</span>
                  </div>
                  <div className="progress-mini" style={{ height: '6px', marginTop: '8px' }}>
                    <div className="progress-mini-fill" style={{ width: `${stats.ServerHealth?.RAM?.percent || 0}%`, background: 'var(--success-clr)' }} />
                  </div>
                  <span className="label" style={{ fontSize: '0.7rem', marginTop: '6px', display: 'block' }}>
                    {sizeFormat(stats.ServerHealth?.RAM?.used || 0)} / {sizeFormat(stats.ServerHealth?.RAM?.total || 0)}
                  </span>
                </div>

                <div className="stat-card-modern" style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="label">Network Rate:</span>
                    <span className="value" style={{ color: 'var(--info-clr)' }}>{stats.ServerHealth?.Network || '0 KB/s'}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* حالة الاتصال والنشاط */}
        <div className="dashboard-group server-group-card card-glass">
          <h3 className="group-title"><i className="fas fa-network-wired" /> حالة الاتصال والنشاط</h3>
          <div className="stats-mini-grid">
            {stats ? (
              <>
                <div className="stat-card-modern">
                  <span className="label">Connection</span>
                  <span className="value" style={{ color: '#10b981' }}>
                    <i className="fas fa-check-circle" /> Online
                  </span>
                </div>
                <div className="stat-card-modern">
                  <span className="label">Uptime</span>
                  <span className="value" style={{ fontSize: '1.1rem' }}>{uptime}</span>
                </div>
                <div className="stat-card-modern" style={{ gridColumn: 'span 2' }}>
                  <span className="label">Started At</span>
                  <span className="value" style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{startTimeStr}</span>
                </div>
                <div className="stat-card-modern">
                  <span className="label">HTTP Requests</span>
                  <span className="value" style={{ color: 'var(--accent-clr)' }}>
                    {stats.ServerHealth?.HttpRequests?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="stat-card-modern">
                  <span className="label">RX / TX</span>
                  <span className="value" style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span><i className="fas fa-arrow-down" style={{ color: 'var(--success-clr)', marginLeft: '4px', fontSize: '0.7rem' }} />RX: {sizeFormat(stats.ServerHealth?.BytesReceived || 0)}</span>
                    <span><i className="fas fa-arrow-up" style={{ color: 'var(--accent-clr)', marginLeft: '4px', fontSize: '0.7rem' }} />TX: {sizeFormat(stats.ServerHealth?.BytesSent || 0)}</span>
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="stat-item"><span className="label">Connection</span><span className="value">{error ? 'Offline' : 'Connecting...'}</span></div>
                <div className="stat-item"><span className="label">Uptime</span><span className="value">00:00:00</span></div>
              </>
            )}
          </div>
        </div>

        {/* التخزين وقاعدة البيانات */}
        <div className="dashboard-group storage-group-card card-glass">
          <h3 className="group-title"><i className="fas fa-database" /> التخزين وقاعدة البيانات</h3>
          <div className="stats-mini-grid">
            {!stats ? (
              <div className="stat-placeholder"><i className="fas fa-spinner fa-pulse" /> جاري التحميل...</div>
            ) : (
              <>
                <div className="stat-card-modern" style={{ gridColumn: 'span 2' }}>
                  <span className="label">DB Size</span>
                  <span className="value" style={{ color: 'var(--accent-clr)' }}>{dataSize}</span>
                </div>
                <div className="stat-card-modern" style={{ gridColumn: 'span 2' }}>
                  <span className="label">Total Games</span>
                  <span className="value">{total.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-lower-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="compact-card chart-card card-glass">
          <h3 className="group-title"><i className="fas fa-chart-line" /> Crawler Performance</h3>
          <div className="chart-container">
            <canvas ref={chartRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
