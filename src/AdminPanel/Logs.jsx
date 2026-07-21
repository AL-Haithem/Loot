// Logs section — adapted from Temp/Logs.jsx
import { useState, useEffect, useRef } from 'react'
import { API_BASE } from '../api.js'
import { csrfStore } from '../csrfStore.js'

function escapeHtml(text) {
  if (typeof text !== 'string') return text
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export default function Logs({ isActive }) {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(false)
  const intervalRef           = useRef(null)

  const loadLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/siri0/logs`, {
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfStore.get() ?? '' },
      })
      if (!res.ok) throw new Error('Failed to load logs')
      const data = await res.json()
      setLogs((data.logs || []).reverse())
    } catch (err) {
      console.error(err)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isActive) {
      loadLogs()
      intervalRef.current = setInterval(loadLogs, 10000)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive])

  const getLogClass = (line) => {
    if (line.includes('ERROR') || line.includes('❌')) return 'log-line error'
    if (line.includes('WARNING') || line.includes('⚠️')) return 'log-line warning'
    if (line.includes('SUCCESS') || line.includes('✅')) return 'log-line success'
    return 'log-line'
  }

  return (
    <div id="logs" className={`section ${isActive ? 'active' : ''}`}>
      <div className="section-header">
        <h2>
          <i className="fas fa-history" /> System Logs
          <span className="subtitle">تعقب النشاطات والأخطار</span>
        </h2>
        <button className="btn btn-info btn-xs" onClick={loadLogs}>
          <i className="fas fa-sync-alt" /> Refresh
        </button>
      </div>

      <div className="logs-wrapper shadow-soft card-glass">
        <div className="logs-feed-header">
          <span><i className="fas fa-list" /> Last 50 system events</span>
        </div>
        <div className="activity-feed">
          {loading && logs.length === 0 ? (
            <div className="log-line">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="log-line">No logs available</div>
          ) : (
            logs.map((line, i) => (
              <div
                key={i}
                className={getLogClass(line)}
                dangerouslySetInnerHTML={{ __html: escapeHtml(line) }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
