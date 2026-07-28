import { useState, useCallback, useEffect, useRef } from 'react'
import { API_BASE } from '../api.js'
import { csrfStore } from '../csrfStore.js'

/* ─── helpers ─────────────────────────────────── */
function fmtDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function Num({ v }) {
  return <span className="cw-num">{(v ?? 0).toLocaleString()}</span>
}

/* ─── 1. Global status banner ──────────────────── */
function StatusBanner({ refreshRunning, syncRunning, workerRunning }) {
  const anyRunning = refreshRunning || syncRunning || workerRunning
  const label = refreshRunning ? 'Refresh Running'
              : syncRunning    ? 'Sync in Progress'
              : workerRunning  ? 'Worker Processing'
              : 'All Systems Idle'
  const cls = anyRunning ? 'cw-banner running' : 'cw-banner idle'

  return (
    <div className={cls}>
      <span className="cw-banner-dot" />
      <span className="cw-banner-label">{label}</span>
      {anyRunning && (
        <span className="cw-banner-phases">
          {refreshRunning && <span className="cw-phase">Refresh</span>}
          {syncRunning    && <span className="cw-phase sync">Sync</span>}
          {workerRunning  && <span className="cw-phase worker">Worker</span>}
        </span>
      )}
    </div>
  )
}

/* ─── 2. NewAppsRefresh summary card ──────────── */
function RefreshCard({ isRunning, total, filtered }) {
  const diff  = total - filtered
  const pct   = total > 0 ? Math.round((filtered / total) * 100) : 0

  return (
    <div className="cw-card refresh-card">
      <div className="cw-card-head">
        <div className="cw-card-icon" style={{ background: 'rgba(0,242,254,0.08)', color: 'var(--accent-clr)' }}>
          <i className="fas fa-sync-alt" />
        </div>
        <div>
          <div className="cw-card-title">New Apps Refresh</div>
          <div className="cw-card-sub">Steam catalog diff cycle</div>
        </div>
        <span className={`cw-chip ${isRunning ? 'chip-running' : 'chip-idle'}`}>
          <span className="cw-dot" />
          {isRunning ? 'Running' : 'Idle'}
        </span>
      </div>

      <div className="cw-counters-row">
        <div className="cw-counter">
          <span className="cw-counter-lbl">Total Apps</span>
          <span className="cw-counter-val accent"><Num v={total} /></span>
        </div>
        <div className="cw-counter-sep" />
        <div className="cw-counter">
          <span className="cw-counter-lbl">Filtered Out</span>
          <span className="cw-counter-val muted"><Num v={filtered} /></span>
        </div>
        <div className="cw-counter-sep" />
        <div className="cw-counter">
          <span className="cw-counter-lbl">Net Processed</span>
          <span className="cw-counter-val"><Num v={diff} /></span>
        </div>
      </div>

      {/* filter ratio bar */}
      <div className="cw-ratio-wrap">
        <div className="cw-ratio-labels">
          <span>{pct}% filtered</span>
          <span>{100 - pct}% passed</span>
        </div>
        <div className="cw-ratio-track">
          <div className="cw-ratio-fill filtered" style={{ width: `${pct}%` }} />
          <div className="cw-ratio-fill passed"   style={{ width: `${100 - pct}%` }} />
        </div>
      </div>
    </div>
  )
}

/* ─── 3. SyncResume card ──────────────────────── */
function SyncCard({ sync }) {
  const {
    SyncRunning, Remaining, NotAffected,
    New, Updated, Deleted, Changes,
    Duration, DataBaseSyncProgress
  } = sync

  const processed   = (New ?? 0) + (Updated ?? 0) + (Deleted ?? 0)
  const grandTotal  = processed + (Remaining ?? 0)
  const pct         = grandTotal > 0 ? Math.min(100, Math.round((processed / grandTotal) * 100)) : 0

  const stats = [
    { icon: 'fa-plus-circle',   label: 'New',         val: New        ?? 0, color: 'var(--success-clr)' },
    { icon: 'fa-pen',           label: 'Updated',     val: Updated    ?? 0, color: 'var(--accent-clr)'  },
    { icon: 'fa-trash-alt',     label: 'Deleted',     val: Deleted    ?? 0, color: 'var(--danger-clr)'  },
    { icon: 'fa-ban',           label: 'No Change',   val: NotAffected?? 0, color: '#64748b'            },
    { icon: 'fa-bolt',          label: 'Changes',     val: Changes    ?? 0, color: 'var(--warning-clr)' },
    { icon: 'fa-hourglass-half',label: 'Remaining',   val: Remaining  ?? 0, color: '#94a3b8'            },
  ]

  return (
    <div className="cw-card sync-card">
      <div className="cw-card-head">
        <div className="cw-card-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
          <i className="fas fa-database" />
        </div>
        <div>
          <div className="cw-card-title">Database Sync</div>
          <div className="cw-card-sub">Catalog ↔ DB reconciliation</div>
        </div>
        <span className={`cw-chip ${SyncRunning ? 'chip-running' : 'chip-idle'}`}>
          <span className="cw-dot" />
          {SyncRunning ? 'Syncing' : 'Idle'}
        </span>
      </div>

      {/* progress */}
      <div className="cw-progress-block">
        <div className="cw-progress-labels">
          <span className="cw-progress-txt">
            {DataBaseSyncProgress || (SyncRunning ? 'Syncing…' : 'Awaiting next sync')}
          </span>
          <span className="cw-progress-pct">{pct}%</span>
        </div>
        <div className="cw-progress-track">
          <div className="cw-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="cw-processed-line">
          <span>{processed.toLocaleString()} processed</span>
          <span>{Remaining?.toLocaleString() ?? 0} remaining</span>
        </div>
      </div>

      {/* stats grid */}
      <div className="cw-sync-grid">
        {stats.map(({ icon, label, val, color }) => (
          <div key={label} className="cw-sync-cell">
            <i className={`fas ${icon}`} style={{ color }} />
            <span className="cw-sync-val" style={{ color }}>{val.toLocaleString()}</span>
            <span className="cw-sync-lbl">{label}</span>
          </div>
        ))}
      </div>

      {/* duration */}
      <div className="cw-sync-footer">
        <i className="fas fa-clock" />
        <span>Duration: <strong>{fmtDuration(Duration)}</strong></span>
      </div>
    </div>
  )
}

/* ─── 4. GamesWorker card ─────────────────────── */
function WorkerCard({ worker, statusMsg }) {
  const {
    WorkerRunning, LastLog, Processed,
    CurrentTotal, DataReason, PriceReason, Failed
  } = worker

  const pct = CurrentTotal > 0
    ? Math.min(100, Math.round((Processed / CurrentTotal) * 100))
    : 0

  return (
    <div className="cw-card worker-card">
      <div className="cw-card-head">
        <div className="cw-card-icon" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
          <i className="fas fa-robot" />
        </div>
        <div>
          <div className="cw-card-title">Games Worker</div>
          <div className="cw-card-sub">Data & price enrichment engine</div>
        </div>
        <span className={`cw-chip ${WorkerRunning ? 'chip-worker' : 'chip-idle'}`}>
          <span className="cw-dot" />
          {WorkerRunning ? 'Processing' : 'Idle'}
        </span>
      </div>

      {/* progress */}
      <div className="cw-progress-block">
        <div className="cw-progress-labels">
          <span className="cw-progress-txt worker-log">{LastLog || 'Waiting…'}</span>
          <span className="cw-progress-pct">{pct}%</span>
        </div>
        <div className="cw-progress-track">
          <div className="cw-progress-fill worker-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="cw-processed-line">
          <span>{(Processed ?? 0).toLocaleString()} / {(CurrentTotal ?? 0).toLocaleString()}</span>
        </div>
      </div>

      {/* breakdown chips */}
      <div className="cw-worker-chips">
        <div className="cw-wchip data">
          <i className="fas fa-file-code" />
          <div>
            <span className="cw-wchip-val">{(DataReason ?? 0).toLocaleString()}</span>
            <span className="cw-wchip-lbl">Data Fetches</span>
          </div>
        </div>
        <div className="cw-wchip price">
          <i className="fas fa-tags" />
          <div>
            <span className="cw-wchip-val">{(PriceReason ?? 0).toLocaleString()}</span>
            <span className="cw-wchip-lbl">Price Fetches</span>
          </div>
        </div>
        <div className="cw-wchip fail">
          <i className="fas fa-exclamation-circle" />
          <div>
            <span className="cw-wchip-val">{(Failed ?? 0).toLocaleString()}</span>
            <span className="cw-wchip-lbl">Failed</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── 5. Store distribution bar (legacy) ─────── */
function StoreDistBar({ stats }) {
  const items = [
    { cls: 'seg-paid',    color: '#8b5cf6', label: 'Paid',        val: stats.paidGames  },
    { cls: 'seg-free',    color: '#10b981', label: 'Free',        val: stats.freeGames  },
    { cls: 'seg-coming',  color: '#fbbf24', label: 'Coming Soon', val: stats.comingSoon },
    { cls: 'seg-left',    color: '#f87171', label: 'Unprocessed', val: stats.remaining  },
  ]
  const total = stats.total || 1

  return (
    <div className="cw-card distbar-card">
      <div className="cw-distbar-head">
        <i className="fas fa-chart-pie" /> Store Distribution
        <span className="cw-distbar-total">{total.toLocaleString()} total</span>
      </div>
      <div className="cw-distbar-track">
        {items.map(({ cls, val }) => (
          <div
            key={cls}
            className={`cw-distbar-seg ${cls}`}
            style={{ width: `${(val / total * 100) || 0}%` }}
          />
        ))}
      </div>
      <div className="cw-distbar-legend">
        {items.map(({ color, label, val }) => (
          <div key={label} className="cw-legend-item">
            <span className="cw-legend-dot" style={{ background: color }} />
            <span className="cw-legend-lbl">{label}</span>
            <span className="cw-legend-val">{val?.toLocaleString() ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── 6. Control panel ────────────────────────── */
function ControlPanel({ isRunning, crawlerMode, setCrawlerMode, onStart, statusMsg, logs, clearLogs }) {
  return (
    <div className="cw-control-panel">
      {/* Mode picker */}
      <div className="cw-mode-picker">
        <span className="cw-mode-label">Crawling Mode</span>
        <div className="cw-mode-seg">
          {[
            { key: 'both',  icon: 'fa-layer-group', label: 'All'   },
            { key: 'price', icon: 'fa-tags',        label: 'Price' },
            { key: 'data',  icon: 'fa-database',    label: 'Data'  },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              className={`cw-seg-btn ${crawlerMode === key ? 'active' : ''}`}
              onClick={() => !isRunning && setCrawlerMode(key)}
              disabled={isRunning}
            >
              <i className={`fas ${icon}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Action */}
      <div className="cw-actions">
        <button
          className={`cw-start-btn ${isRunning ? 'stop' : 'start'}`}
          onClick={onStart}
        >
          <i className={`fas ${isRunning ? 'fa-stop' : 'fa-play'}`} />
          {isRunning ? 'Stop Crawler' : 'Start Crawler'}
        </button>
        <button className="cw-clear-btn" onClick={clearLogs} title="Clear logs">
          <i className="fas fa-broom" />
        </button>
      </div>

      <div className="cw-status-txt">{statusMsg}</div>

      {/* Live log terminal */}
      <div className="cw-terminal">
        <div className="cw-terminal-head">
          <i className="fas fa-terminal" /> Live Operation Log
        </div>
        <div className="cw-terminal-body">
          {logs.length === 0 && (
            <div className="cw-terminal-empty">No logs yet…</div>
          )}
          {logs.map((entry, i) => (
            <div key={i} className={`cw-log-line ${entry.type || ''}`}>
              <span className="cw-log-id">#{entry.id}</span>
              <span className="cw-log-name">{entry.name}</span>
              {entry.detail && <span className="cw-log-detail">{entry.detail}</span>}
              <span className="cw-log-meta">{entry.prog}% · {entry.time || '--'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── default state ───────────────────────────── */
const DEFAULT_SYNC = {
  SyncRunning: false, Remaining: 0, NotAffected: 0,
  New: 0, Updated: 0, Deleted: 0, Changes: 0,
  Duration: 0, DataBaseSyncProgress: ''
}
const DEFAULT_WORKER = {
  WorkerRunning: false, LastLog: '', Processed: 0,
  CurrentTotal: 0, DataReason: 0, PriceReason: 0, Failed: 0
}

/* ─── Main export ─────────────────────────────── */
export default function Crawler({ isActive, metrics }) {
  const [crawlerMode, setCrawlerMode] = useState('both')
  const [isRunning, setIsRunning]     = useState(false)
  const [statusMsg, setStatusMsg]     = useState('Ready to start…')
  const [logs, setLogs]               = useState([])

  /* store dist stats (legacy worker data) */
  const [storeStats, setStoreStats] = useState({
    total: 0, filled: 0, remaining: 0,
    totalApps: 0, comingSoon: 0, freeGames: 0, paidGames: 0
  })

  /* NewAppsRefresh */
  const [refreshRunning, setRefreshRunning]   = useState(false)
  const [refreshTotal, setRefreshTotal]       = useState(0)
  const [refreshFiltered, setRefreshFiltered] = useState(0)

  /* SyncResume */
  const [syncResume, setSyncResume] = useState(DEFAULT_SYNC)

  /* GamesWorker */
  const [gamesWorker, setGamesWorker] = useState(DEFAULT_WORKER)

  const csrfHeader = () => ({ 'X-CSRF-Token': csrfStore.get() ?? '' })

  /* ── Consume SSE metrics ── */
  useEffect(() => {
    if (!metrics) return

    const nar = metrics.Crawler?.NewAppsRefresh ?? metrics.NewAppsRefresh
    if (nar) {
      if (nar.RefreshRunning !== undefined) setRefreshRunning(nar.RefreshRunning)
      if (nar.Total          !== undefined) setRefreshTotal(nar.Total)
      if (nar.Filtered       !== undefined) setRefreshFiltered(nar.Filtered)
      if (nar.SyncResume)                  setSyncResume(prev => ({ ...prev, ...nar.SyncResume }))
      if (nar.GamesWorker) {
        setGamesWorker(prev => ({ ...prev, ...nar.GamesWorker }))
        if (nar.GamesWorker.WorkerRunning !== undefined) setIsRunning(nar.GamesWorker.WorkerRunning)
        if (nar.GamesWorker.LastLog)                     setStatusMsg(nar.GamesWorker.LastLog)
      }
    }

    /* legacy GamesWorker flat path */
    const gw = metrics.Crawler?.GamesWorker ?? metrics.Crawler ?? metrics.CrawlerData
    if (gw) {
      setStoreStats(prev => ({
        total:     gw.Total       ?? prev.total,
        filled:    gw.Filled      ?? prev.filled,
        remaining: gw.Remaining   ?? prev.remaining,
        totalApps: gw.totalApps   ?? prev.totalApps,
        comingSoon:gw.comingSoon  ?? prev.comingSoon,
        freeGames: gw.freeGames   ?? prev.freeGames,
        paidGames: gw.paidGames   ?? prev.paidGames,
      }))
      if (gw.isRunning     !== undefined) setIsRunning(gw.isRunning)
      if (gw.WorkerRunning !== undefined) setIsRunning(gw.WorkerRunning)
      if (gw.details) setStatusMsg(`Crawling: ${gw.details}`)
      else if (gw.text)    setStatusMsg(gw.text)
      else if (gw.LastLog) setStatusMsg(gw.LastLog)

      if (gw.log) {
        setLogs(prev => {
          if (prev[0]?.id === gw.log.id && prev[0]?.prog === gw.log.prog) return prev
          return [{ ...gw.log, id: gw.log.id || 'SYNC' }, ...prev].slice(0, 100)
        })
      }
    }
  }, [metrics])

  const handleStart = useCallback(() => {
    if (isRunning) {
      setIsRunning(false)
      fetch(`${API_BASE}/api/siri0/games/stop`, {
        method: 'POST', credentials: 'include', headers: csrfHeader()
      }).catch(() => {})
      return
    }
    setIsRunning(true)
    fetch(`${API_BASE}/api/siri0/games/start`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...csrfHeader() },
      body: JSON.stringify({ mode: crawlerMode })
    }).catch(() => setIsRunning(false))
  }, [crawlerMode, isRunning])

  return (
    <div id="crawler" className={`section ${isActive ? 'active' : ''}`}>
      <div className="section-header">
        <div className="header-titles">
          <h2>
            <i className="fas fa-robot" />
            Crawler Manager
          </h2>
          <span className="subtitle">Steam catalog crawler & data enrichment engine</span>
        </div>
        <div className={`status-indicator ${refreshRunning || syncResume.SyncRunning || gamesWorker.WorkerRunning ? 'active' : ''}`} />
      </div>

      {/* Status banner */}
      <StatusBanner
        refreshRunning={refreshRunning}
        syncRunning={syncResume.SyncRunning}
        workerRunning={gamesWorker.WorkerRunning}
      />

      {/* Top three monitoring cards */}
      <div className="cw-top-row">
        <RefreshCard
          isRunning={refreshRunning}
          total={refreshTotal}
          filtered={refreshFiltered}
        />
        <SyncCard sync={syncResume} />
        <WorkerCard worker={gamesWorker} statusMsg={statusMsg} />
      </div>

      {/* Store distribution */}
      <StoreDistBar stats={storeStats} />

      {/* Control & logs */}
      <ControlPanel
        isRunning={isRunning}
        crawlerMode={crawlerMode}
        setCrawlerMode={setCrawlerMode}
        onStart={handleStart}
        statusMsg={statusMsg}
        logs={logs}
        clearLogs={() => setLogs([])}
      />
    </div>
  )
}
