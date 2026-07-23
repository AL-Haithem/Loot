import { useState, useCallback, useEffect } from 'react'
import { API_BASE } from '../api.js'
import { csrfStore } from '../csrfStore.js'

// ── RefreshRunning Status Card ─────────────────────────────────────────────────
function RefreshRunningCard({ isRunning, total, filtered }) {
  return (
    <div className="card-glass refresh-running-card">
      <div className="rr-header">
        <span className="rr-title">
          <i className="fas fa-sync-alt" /> New Apps Refresh
        </span>
        <span className={`rr-status-chip ${isRunning ? 'running' : 'idle'}`}>
          <span className="rr-dot" />
          {isRunning ? 'Running' : 'Idle'}
        </span>
      </div>
      <div className="rr-counters">
        <div className="rr-counter-item">
          <span className="rr-counter-label">Total</span>
          <span className="rr-counter-value accent">{total.toLocaleString()}</span>
        </div>
        <div className="rr-counter-divider" />
        <div className="rr-counter-item">
          <span className="rr-counter-label">Filtered</span>
          <span className="rr-counter-value">{filtered.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

// ── SyncResume Card ────────────────────────────────────────────────────────────
function SyncResumeCard({ sync }) {
  const { SyncRunning, Remaining, NotAffected, New, Updated, Deleted, Changes, Duration, DataBaseSyncProgress } = sync
  const processed = (New ?? 0) + (Updated ?? 0) + (Deleted ?? 0)
  const grandTotal = processed + (Remaining ?? 0)
  const pct = grandTotal > 0 ? Math.round((processed / grandTotal) * 100) : 0
  const mins = Math.floor((Duration ?? 0) / 60)
  const secs = ((Duration ?? 0) % 60).toString().padStart(2, '0')

  const fields = [
    { icon: 'fa-plus',          label: 'New',         val: New ?? 0,         color: 'var(--success-clr)' },
    { icon: 'fa-pen',           label: 'Updated',      val: Updated ?? 0,     color: 'var(--accent-clr)'  },
    { icon: 'fa-trash',         label: 'Deleted',      val: Deleted ?? 0,     color: 'var(--danger-clr)'  },
    { icon: 'fa-equals',        label: 'No Change',    val: NotAffected ?? 0, color: '#64748b'            },
    { icon: 'fa-bolt',          label: 'Changes',      val: Changes ?? 0,     color: 'var(--warning-clr)' },
    { icon: 'fa-hourglass-half',label: 'Remaining',    val: Remaining ?? 0,   color: '#94a3b8'            },
  ]

  return (
    <div className="card-glass sync-resume-card">
      <div className="rr-header">
        <span className="rr-title">
          <i className="fas fa-database" /> Sync Resume
        </span>
        <span className={`rr-status-chip ${SyncRunning ? 'running' : 'idle'}`}>
          <span className="rr-dot" />
          {SyncRunning ? 'Syncing' : 'Idle'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="sr-progress-wrap">
        <div className="sr-progress-labels">
          <span className="sr-progress-text">{DataBaseSyncProgress || (SyncRunning ? 'Syncing...' : 'Awaiting sync')}</span>
          <span className="sr-progress-pct">{pct}%</span>
        </div>
        <div className="progress-outer">
          <div className="progress-inner" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Mini stat grid */}
      <div className="sr-fields-grid">
        {fields.map(({ icon, label, val, color }) => (
          <div key={label} className="sr-field-item">
            <i className={`fas ${icon}`} style={{ color }} />
            <span className="sr-field-label">{label}</span>
            <span className="sr-field-val" style={{ color }}>{val.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Duration */}
      <div className="sr-duration">
        <i className="fas fa-clock" /> Duration: <strong>{mins}:{secs}</strong>
      </div>
    </div>
  )
}

// ── Default SyncResume state ───────────────────────────────────────────────────
const DEFAULT_SYNC = {
  SyncRunning: false, Remaining: 0, NotAffected: 0,
  New: 0, Updated: 0, Deleted: 0, Changes: 0, Duration: 0, DataBaseSyncProgress: ''
}

export default function Crawler({ isActive, metrics }) {
  const [isRunning, setIsRunning]   = useState(false)
  const [crawlerMode, setCrawlerMode] = useState('both')
  const [progress, setProgress]     = useState(0)
  const [timeText, setTimeText]     = useState('-- remaining')
  const [statusMsg, setStatusMsg]   = useState('Ready to start...')
  const [logs, setLogs]             = useState([])
  const [stats, setStats] = useState({
    total: 0, filled: 0, remaining: 0,
    totalApps: 0, comingSoon: 0, freeGames: 0, paidGames: 0
  })

  // NewAppsRefresh state
  const [refreshRunning, setRefreshRunning] = useState(false)
  const [refreshTotal, setRefreshTotal]     = useState(0)
  const [refreshFiltered, setRefreshFiltered] = useState(0)
  const [syncResume, setSyncResume]         = useState(DEFAULT_SYNC)

  const csrfHeader = () => ({ 'X-CSRF-Token': csrfStore.get() ?? '' })

  // ── Sync with global SSE metrics ──
  useEffect(() => {
    if (!metrics) return;

    // ── NewAppsRefresh (RefreshRunning + SyncResume) ──
    const nar = metrics.Crawler?.NewAppsRefresh ?? metrics.NewAppsRefresh
    if (nar) {
      if (nar.RefreshRunning !== undefined) setRefreshRunning(nar.RefreshRunning)
      if (nar.Total        !== undefined) setRefreshTotal(nar.Total)
      if (nar.Filtered     !== undefined) setRefreshFiltered(nar.Filtered)
      if (nar.SyncResume)  setSyncResume(prev => ({ ...prev, ...nar.SyncResume }))
    }

    // ── GamesWorker (existing crawler) ──
    const crawlerData = metrics.Crawler?.GamesWorker ?? metrics.Crawler ?? metrics.crawler ?? metrics.CrawlerData;
    
    if (crawlerData) {
      setStats(prev => ({
        total: crawlerData.Total ?? prev.total,
        filled: crawlerData.Filled ?? prev.filled,
        remaining: crawlerData.Remaining ?? prev.remaining,
        totalApps: crawlerData.totalApps ?? prev.totalApps,
        comingSoon: crawlerData.comingSoon ?? prev.comingSoon,
        freeGames: crawlerData.freeGames ?? prev.freeGames,
        paidGames: crawlerData.paidGames ?? prev.paidGames
      }));

      if (crawlerData.isRunning !== undefined) setIsRunning(crawlerData.isRunning)
      if (crawlerData.WorkerRunning !== undefined) setIsRunning(crawlerData.WorkerRunning)

      if (crawlerData.prog !== undefined) setProgress(crawlerData.prog);
      if (crawlerData.eta  !== undefined) setTimeText(`${crawlerData.eta} remaining`);
      
      if (crawlerData.details) setStatusMsg(`Crawling: ${crawlerData.details}`);
      else if (crawlerData.text) setStatusMsg(crawlerData.text);
      else if (crawlerData.LastLog) setStatusMsg(crawlerData.LastLog);

      if (crawlerData.log) {
        setLogs(prev => {
          if (prev.length > 0 && prev[0].id === crawlerData.log.id && prev[0].prog === crawlerData.log.prog) return prev;
          return [{ ...crawlerData.log, id: crawlerData.log.id || 'SYNC' }, ...prev].slice(0, 100);
        });
      }
    }
  }, [metrics]);

  const startCrawler = useCallback(() => {
    if (isRunning) {
      setIsRunning(false)
      fetch(`${API_BASE}/api/siri0/games/stop`, {
        method: 'POST', credentials: 'include',
        headers: csrfHeader()
      }).catch(() => {})
      return
    }
    
    setIsRunning(true)
    fetch(`${API_BASE}/api/siri0/games/start`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...csrfHeader() },
      body: JSON.stringify({ mode: crawlerMode })
    }).catch(() => setIsRunning(false))
  }, [crawlerMode, isRunning])

  const clearLogs = () => setLogs([])

  return (
    <div id="crawler" className={`section ${isActive ? 'active' : ''}`}>
      <div className="section-header">
        <h2>
          <i className="fas fa-robot" /> Crawler Manager
          <span className="subtitle">إدارة جلب البيانات الذكي</span>
        </h2>
        <div className={`status-indicator ${isRunning || refreshRunning || syncResume.SyncRunning ? 'active' : ''}`} />
      </div>

      {/* ── NewAppsRefresh cards ── */}
      <div className="nar-cards-row">
        <RefreshRunningCard
          isRunning={refreshRunning}
          total={refreshTotal}
          filtered={refreshFiltered}
        />
        <SyncResumeCard sync={syncResume} />
      </div>

      {/* Stacked bar (GamesWorker) */}
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
                  ].map(({ key, icon, label }) => (
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
