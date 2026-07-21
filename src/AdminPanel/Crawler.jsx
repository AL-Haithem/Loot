// Crawler section — adapted from Temp/Crawler.jsx
import { useState, useRef, useCallback, useEffect } from 'react'
import { API_BASE } from '../api.js'
import { csrfStore } from '../csrfStore.js'

export default function Crawler({ isActive }) {
  const [isRunning, setIsRunning]   = useState(false)
  const [crawlerMode, setCrawlerMode] = useState('both')
  const [progress, setProgress]     = useState(0)
  const [timeText, setTimeText]     = useState('-- remaining')
  const [statusMsg, setStatusMsg]   = useState('Ready to start...')
  const [logs, setLogs]             = useState([])
  const eventSourceRef              = useRef(null)
  const [stats, setStats] = useState({
    total: 0, filled: 0, remaining: 0,
    totalApps: 0, comingSoon: 0, freeGames: 0, paidGames: 0
  })

  const csrfHeader = () => ({ 'X-CSRF-Token': csrfStore.get() ?? '' })

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) return
    const es = new EventSource(`${API_BASE}/api/siri0/games/start`, { withCredentials: true })
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.eventType === 'status') {
          if (data.type === 'crawler') {
            setProgress(data.prog || 0)
            setTimeText(`${data.eta} remaining`)
            setStatusMsg(`Crawling: ${data.details}`)
          } else if (data.type === 'sync') {
            setStatusMsg(data.text)
          }
        } else {
          setProgress(data.prog || 0)
          setTimeText(data.time || '-- remaining')
          setStatusMsg(`Processing: ${data.name}`)
          setLogs(prev => [{ ...data, id: data.id || 'SYNC' }, ...prev].slice(0, 100))
        }
      } catch (err) {
        console.warn('Invalid crawler data:', event.data, err)
      }
    }

    es.onerror = () => {
      setStatusMsg('❌ Connection error!')
      es.close()
      eventSourceRef.current = null
      setIsRunning(false)
    }
  }, [])

  const startCrawler = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsRunning(false)
      fetch(`${API_BASE}/api/siri0/games/stop`, {
        method: 'POST', credentials: 'include',
        headers: csrfHeader()
      })
      return
    }
    setIsRunning(true)
    fetch(`${API_BASE}/api/siri0/games/start`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...csrfHeader() },
      body: JSON.stringify({ mode: crawlerMode })
    })
      .then(() => connectSSE())
      .catch(() => setIsRunning(false))
  }, [crawlerMode, connectSSE])

  useEffect(() => {
    const fetchStats = () => {
      fetch(`${API_BASE}/api/siri0/games/progress`, { credentials: 'include', headers: csrfHeader() })
        .then(res => res.json())
        .then(data => {
          setStats({
            total: data.Total || 0, filled: data.Filled || 0, remaining: data.Remaining || 0,
            totalApps: data.totalApps || 0, comingSoon: data.comingSoon || 0,
            freeGames: data.freeGames || 0, paidGames: data.paidGames || 0
          })
          if (data.isRunning) { setIsRunning(true); connectSSE() }
        })
        .catch(() => {})
    }
    fetchStats()
    let interval = null
    if (isRunning) interval = setInterval(fetchStats, 5000)
    return () => { if (interval) clearInterval(interval) }
  }, [isRunning, connectSSE])

  const clearLogs = () => setLogs([])

  return (
    <div id="crawler" className={`section ${isActive ? 'active' : ''}`}>
      <div className="section-header">
        <h2>
          <i className="fas fa-robot" /> Crawler Manager
          <span className="subtitle">إدارة جلب البيانات الذكي</span>
        </h2>
        <div className={`status-indicator ${isRunning ? 'active' : ''}`} />
      </div>

      {/* Stacked bar */}
      <div className="stats-bar-container card-glass">
        <h3 className="group-title"><i className="fas fa-chart-pie" /> توزيع ألعاب المتجر</h3>
        <div className="stacked-bar-outer">
          <div className="stacked-bar-segment segment-paid" style={{ width: `${(stats.paidGames / stats.total * 100) || 0}%` }}>
            <span className="segment-tooltip">Paid: {stats.paidGames.toLocaleString()} ({((stats.paidGames / stats.total * 100) || 0).toFixed(1)}%)</span>
          </div>
          <div className="stacked-bar-segment segment-free" style={{ width: `${(stats.freeGames / stats.total * 100) || 0}%` }}>
            <span className="segment-tooltip">Free: {stats.freeGames.toLocaleString()} ({((stats.freeGames / stats.total * 100) || 0).toFixed(1)}%)</span>
          </div>
          <div className="stacked-bar-segment segment-coming" style={{ width: `${(stats.comingSoon / stats.total * 100) || 0}%` }}>
            <span className="segment-tooltip">Coming Soon: {stats.comingSoon.toLocaleString()}</span>
          </div>
          <div className="stacked-bar-segment segment-remaining" style={{ width: `${(stats.remaining / stats.total * 100) || 0}%` }}>
            <span className="segment-tooltip">Remaining: {stats.remaining.toLocaleString()}</span>
          </div>
        </div>
        <div className="stats-bar-legend">
          {[
            { cls: 'color-paid',      label: 'Paid',        val: stats.paidGames },
            { cls: 'color-free',      label: 'Free',        val: stats.freeGames },
            { cls: 'color-coming',    label: 'Coming Soon', val: stats.comingSoon },
            { cls: 'color-remaining', label: 'Remaining',   val: stats.remaining },
            { cls: 'color-total',     label: 'Total',       val: stats.total, highlight: true },
          ].map(({ cls, label, val, highlight }) => (
            <div key={label} className={`legend-item${highlight ? ' highlight' : ''}`}>
              <span className={`legend-dot ${cls}`} />
              <div className="legend-info">
                <span className="legend-label">{label}</span>
                <span className="legend-val">{val.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="crawler-layout">
        <div className="crawler-main-card">
          <div className="control-panel card-glass">
            <div className="execution-panel">
              {/* Mode selector */}
              <div className="mode-selector-container">
                <p className="selector-label">Crawling Mode</p>
                <div className="segmented-control card-glass">
                  {[
                    { key: 'both',  icon: 'fas fa-layer-group', label: 'All' },
                    { key: 'price', icon: 'fas fa-tags',        label: 'Price' },
                    { key: 'data',  icon: 'fas fa-database',    label: 'Data' },
                  ].map(({ key, icon, label }, idx) => (
                    <div
                      key={key}
                      className={`segment ${crawlerMode === key ? 'active' : ''}`}
                      onClick={() => !isRunning && setCrawlerMode(key)}
                    >
                      <i className={icon} />
                      <span>{label}</span>
                    </div>
                  ))}
                  <div
                    className="selection-slider"
                    style={{
                      transform: `translateX(${crawlerMode === 'both' ? '0%' : crawlerMode === 'price' ? '100%' : '200%'})`,
                      width: '33.33%',
                    }}
                  />
                </div>
              </div>

              {/* Progress */}
              <div className="progress-wrap">
                <div className="progress-labels">
                  <span>{progress}%</span>
                  <span className="eta">{timeText}</span>
                </div>
                <div className="progress-outer">
                  <div className="progress-inner" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className={`btn ${isRunning ? 'btn-danger' : 'btn-primary'} btn-lg`}
                  onClick={startCrawler}
                >
                  <i className={`fas ${isRunning ? 'fa-pause' : 'fa-play'}`} />
                  {isRunning ? 'Stop' : 'Start Crawler'}
                </button>
                <button className="btn btn-clear" onClick={clearLogs} title="Clear logs">
                  <i className="fas fa-broom" />
                </button>
              </div>
              <div className="status-text">{statusMsg}</div>
            </div>
          </div>
        </div>

        {/* Live logs */}
        <div className="crawler-side-logs card-glass">
          <div className="logs-header-mini">
            <span><i className="fas fa-terminal" /> Live Operation Log</span>
          </div>
          <div className="terminal-logs">
            {logs.map((data, i) => (
              <div key={i} className={`log-card ${data.type || ''}`}>
                <div className="log-top">
                  <span className="game-id">ID: {data.id}</span>
                  <span className="badge">{data.status || data.type}</span>
                </div>
                <div className="game-name">{data.name}</div>
                {data.detail && <div className="game-detail">🛠️ {data.detail}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: '#94a3b8' }}>
                  <span>Progress: {data.prog}%</span>
                  <span>ETA: {data.time || '--'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
