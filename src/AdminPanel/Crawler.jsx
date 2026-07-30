import { useState, useCallback, useEffect } from 'react'
import { API_BASE } from '../api.js'
import { csrfStore } from '../csrfStore.js'

/* ─── helpers ───────────────────────────────────────── */
function N({ v, fallback = 0 }) {
  return <span className="cw-num">{(v ?? fallback).toLocaleString()}</span>
}

/* ─── 1. Status Banner ──────────────────────────────── */
function StatusBanner({ refreshRunning, syncRunning, workerRunning }) {
  const anyRunning = refreshRunning || syncRunning || workerRunning
  const label = refreshRunning ? 'Catalog Refresh Running'
              : syncRunning    ? 'Database Sync in Progress'
              : workerRunning  ? 'Worker Processing Games'
              : 'All Systems Idle'

  return (
    <div className={`cw-banner ${anyRunning ? 'running' : 'idle'}`}>
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

/* ─── 2. AllAppsFetcher card (New Apps Refresh) ─────── */
function RefreshCard({ fetcher }) {
  const {
    RefreshRunning = false,
    TotalFetched   = 0,
    FilteredTotal  = 0,
    Cycle          = 0,
    LastBatch      = 0,
  } = fetcher

  const passedPct = TotalFetched > 0
    ? Math.round(((TotalFetched - FilteredTotal) / TotalFetched) * 100)
    : 0
  const filtPct = 100 - passedPct

  const counters = [
    {
      icon:  'fa-layer-group',
      label: 'Apps Gathered',
      val:   TotalFetched,
      color: 'var(--accent-clr)',
      glow:  'rgba(0,242,254,0.12)',
    },
    {
      icon:  'fa-filter',
      label: 'Total Filtered',
      val:   FilteredTotal,
      color: '#f87171',
      glow:  'rgba(248,113,113,0.12)',
    },
    {
      icon:  'fa-cubes',
      label: 'Last Batch',
      val:   LastBatch,
      color: '#a78bfa',
      glow:  'rgba(167,139,250,0.12)',
    },
    {
      icon:  'fa-redo',
      label: 'Cycle #',
      val:   Cycle,
      color: '#fbbf24',
      glow:  'rgba(251,191,36,0.12)',
      badge: true,
    },
  ]

  return (
    <div className="cw-card refresh-card">
      {/* header */}
      <div className="cw-card-head">
        <div className="cw-card-icon" style={{ background: 'rgba(0,242,254,0.08)', color: 'var(--accent-clr)' }}>
          <i className="fas fa-sync-alt" />
        </div>
        <div>
          <div className="cw-card-title">New Apps Refresh</div>
          <div className="cw-card-sub">Steam catalog fetch & filter cycle</div>
        </div>
        <span className={`cw-chip ${RefreshRunning ? 'chip-running' : 'chip-idle'}`}>
          <span className="cw-dot" />
          {RefreshRunning ? 'Running' : 'Idle'}
        </span>
      </div>

      {/* 4-stat grid */}
      <div className="cw-refresh-grid">
        {counters.map(({ icon, label, val, color, glow, badge }) => (
          <div key={label} className="cw-refresh-cell" style={{ '--cell-glow': glow }}>
            <div className="cw-refresh-cell-icon" style={{ color }}>
              <i className={`fas ${icon}`} />
            </div>
            <span className="cw-refresh-cell-val" style={{ color }}>
              {badge ? `#${val}` : val.toLocaleString()}
            </span>
            <span className="cw-refresh-cell-lbl">{label}</span>
          </div>
        ))}
      </div>

      {/* pass / filter ratio bar */}
      <div className="cw-ratio-wrap">
        <div className="cw-ratio-labels">
          <span>{passedPct}% passed</span>
          <span>{filtPct}% filtered out</span>
        </div>
        <div className="cw-ratio-track">
          <div className="cw-ratio-fill passed"   style={{ width: `${passedPct}%` }} />
          <div className="cw-ratio-fill filtered" style={{ width: `${filtPct}%`  }} />
        </div>
      </div>
    </div>
  )
}

/* ─── 3. SyncResume card ────────────────────────────── */
function SyncCard({ sync }) {
  const {
    SyncRunning         = false,
    Remaining           = 0,
    NotAffected         = 0,
    New                 = 0,
    Updated             = 0,
    Deleted             = 0,
    Changes             = 0,
    Skiped              = 0,
    DataBaseSyncProgress = '0/0',
  } = sync

  const processed = (New ?? 0) + (Updated ?? 0) + (Deleted ?? 0)
  const grandTotal = processed + (Remaining ?? 0)
  const pct = grandTotal > 0 ? Math.min(100, Math.round((processed / grandTotal) * 100)) : 0

  const cells = [
    { icon: 'fa-plus-circle',    label: 'New',        val: New,         color: 'var(--success-clr)' },
    { icon: 'fa-pen',            label: 'Updated',    val: Updated,     color: 'var(--accent-clr)'  },
    { icon: 'fa-trash-alt',      label: 'Deleted',    val: Deleted,     color: 'var(--danger-clr)'  },
    { icon: 'fa-bolt',           label: 'Changes',    val: Changes,     color: 'var(--warning-clr)' },
    { icon: 'fa-ban',            label: 'No Change',  val: NotAffected, color: '#64748b'            },
    { icon: 'fa-forward',        label: 'Skipped',    val: Skiped,      color: '#94a3b8'            },
    { icon: 'fa-hourglass-half', label: 'Remaining',  val: Remaining,   color: '#475569'            },
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
            {SyncRunning ? `Syncing… ${DataBaseSyncProgress}` : DataBaseSyncProgress || 'Awaiting next sync'}
          </span>
          <span className="cw-progress-pct">{pct}%</span>
        </div>
        <div className="cw-progress-track">
          <div className="cw-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="cw-processed-line">
          <span>{processed.toLocaleString()} processed</span>
          <span>{Remaining.toLocaleString()} remaining</span>
        </div>
      </div>

      {/* stats grid – 7 cells */}
      <div className="cw-sync-grid cw-sync-grid-7">
        {cells.map(({ icon, label, val, color }) => (
          <div key={label} className="cw-sync-cell">
            <i className={`fas ${icon}`} style={{ color }} />
            <span className="cw-sync-val" style={{ color }}>{val.toLocaleString()}</span>
            <span className="cw-sync-lbl">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── 4. GamesWorker card ───────────────────────────── */
function WorkerCard({ worker }) {
  const {
    WorkerRunning = false,
    LastLog       = '',
    Processed     = 0,
    Saved         = 0,
    CurrentTotal  = 0,
    DataReason    = 0,
    PriceReason   = 0,
    Failed        = 0,
    Skiped        = 0,
    Paid          = 0,
    Free          = 0,
    ComingSoon    = 0,
  } = worker

  const pct = CurrentTotal > 0
    ? Math.min(100, Math.round((Processed / CurrentTotal) * 100))
    : 0

  /* top-row fetch reason chips */
  const fetchChips = [
    { cls: 'data',  icon: 'fa-file-code',       label: 'Data Fetches',  val: DataReason  },
    { cls: 'price', icon: 'fa-tags',             label: 'Price Fetches', val: PriceReason },
    { cls: 'fail',  icon: 'fa-exclamation-circle', label: 'Failed',      val: Failed      },
    { cls: 'skip',  icon: 'fa-forward',          label: 'Skipped',       val: Skiped      },
  ]

  /* type breakdown cells */
  const typeBreakdown = [
    { icon: 'fa-dollar-sign', label: 'Paid',        val: Paid,      color: '#a78bfa' },
    { icon: 'fa-gift',        label: 'Free',         val: Free,      color: '#34d399' },
    { icon: 'fa-clock',       label: 'Coming Soon',  val: ComingSoon,color: '#fbbf24' },
    { icon: 'fa-save',        label: 'Saved to DB',  val: Saved,     color: 'var(--accent-clr)' },
  ]

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
          <span className="cw-progress-pct">{pct}%</span>
        </div>
        <div className="cw-progress-track">
          <div className="cw-progress-fill worker-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="cw-processed-line">
          <span>{Processed.toLocaleString()} / {CurrentTotal.toLocaleString()} processed</span>
          <span className="cw-saved-badge"><i className="fas fa-save" /> {Saved.toLocaleString()} saved</span>
        </div>
      </div>

      {/* fetch reason chips */}
      <div className="cw-worker-chips">
        {fetchChips.map(({ cls, icon, label, val }) => (
          <div key={cls} className={`cw-wchip ${cls}`}>
            <i className={`fas ${icon}`} />
            <div>
              <span className="cw-wchip-val">{val.toLocaleString()}</span>
              <span className="cw-wchip-lbl">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* type breakdown */}
      <div className="cw-type-breakdown">
        {typeBreakdown.map(({ icon, label, val, color }) => (
          <div key={label} className="cw-type-cell">
            <i className={`fas ${icon}`} style={{ color }} />
            <span className="cw-type-val" style={{ color }}>{val.toLocaleString()}</span>
            <span className="cw-type-lbl">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}



/* ─── 6. Control panel ──────────────────────────────── */
function ControlPanel({ isRunning, crawlerMode, setCrawlerMode, onStart, statusMsg, appLogs, sysLogs, clearLogs }) {
  return (
    <div className="cw-control-panel">
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

      <div className="cw-terminals-wrapper">
        {/* System Logs (LastLog history) */}
        <div className="cw-terminal">
          <div className="cw-terminal-head">
            <i className="fas fa-terminal" /> System Activity Log
            <span className="cw-terminal-count">{sysLogs.length} entries</span>
          </div>
          <div className="cw-terminal-body">
            {sysLogs.length === 0 && (
              <div className="cw-terminal-empty">No system logs yet…</div>
            )}
            {sysLogs.map((entry, i) => (
              <div key={i} className="cw-log-line info">
                <span className="cw-log-name" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>{entry.text}</span>
                <span className="cw-log-meta">{entry.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Processed Apps Log */}
        <div className="cw-terminal">
          <div className="cw-terminal-head">
            <i className="fas fa-gamepad" /> Processed Apps Log
            <span className="cw-terminal-count">{appLogs.length} entries</span>
          </div>
          <div className="cw-terminal-body">
            {appLogs.length === 0 && (
              <div className="cw-terminal-empty">No app entries yet…</div>
            )}
            {appLogs.map((entry, i) => (
              <div key={i} className={`cw-log-line ${entry.type || ''}`}>
                <span className="cw-log-id">#{entry.id}</span>
                <span className="cw-log-name">{entry.name}</span>
                {entry.detail && <span className="cw-log-detail">{entry.detail}</span>}
                <span className="cw-log-meta">{entry.prog} · {entry.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Default states ────────────────────────────────── */
const DEFAULT_FETCHER = {
  RefreshRunning: false,
  TotalFetched:   0,
  FilteredTotal:  0,
  Cycle:          0,
  LastBatch:      0,
}
const DEFAULT_SYNC = {
  SyncRunning:          false,
  Remaining:            0,
  NotAffected:          0,
  New:                  0,
  Updated:              0,
  Deleted:              0,
  Changes:              0,
  Skiped:               0,
  DataBaseSyncProgress: '0/0',
}
const DEFAULT_WORKER = {
  WorkerRunning: false,
  LastLog:       '',
  Processed:     0,
  Saved:         0,
  CurrentTotal:  0,
  DataReason:    0,
  PriceReason:   0,
  Failed:        0,
  Skiped:        0,
  Paid:          0,
  Free:          0,
  ComingSoon:    0,
  LastAppsData:  [],
}

/* ─── Main export ───────────────────────────────────── */
export default function Crawler({ isActive, metrics }) {
  const [crawlerMode, setCrawlerMode] = useState('both')
  const [isRunning,   setIsRunning]   = useState(false)
  const [statusMsg,   setStatusMsg]   = useState('Ready to start…')
  const [appLogs,     setAppLogs]     = useState([])
  const [sysLogs,     setSysLogs]     = useState([])

  const [fetcher,     setFetcher]     = useState(DEFAULT_FETCHER)
  const [syncResume,  setSyncResume]  = useState(DEFAULT_SYNC)
  const [gamesWorker, setGamesWorker] = useState(DEFAULT_WORKER)

  const csrfHeader = () => ({ 'X-CSRF-Token': csrfStore.get() ?? '' })

  /* ── consume SSE metrics ── */
  useEffect(() => {
    if (!metrics) return

    /* Resolve the NewAppsRefresh container */
    const nar = metrics?.Crawler ?? metrics?.NewAppsRefresh
    if (!nar) return

    /* AllAppsFetcher */
    if (nar.AllAppsFetcher) {
      setFetcher(prev => ({ ...prev, ...nar.AllAppsFetcher }))
    }

    /* SyncResume */
    if (nar.SyncResume) {
      setSyncResume(prev => ({ ...prev, ...nar.SyncResume }))
    }

    /* GamesWorker */
    if (nar.GamesWorker) {
      const gw = nar.GamesWorker
      setGamesWorker(prev => ({ ...prev, ...gw }))
      if (gw.WorkerRunning !== undefined) setIsRunning(gw.WorkerRunning)
      if (gw.LastLog) {
        setStatusMsg(gw.LastLog)
        setSysLogs(prev => {
          if (prev.length > 0 && prev[0].text === gw.LastLog) return prev
          return [{ text: gw.LastLog, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 100)
        })
      }

      /* Log feed — pull from LastAppsData entries */
      if (Array.isArray(gw.LastAppsData) && gw.LastAppsData.length > 0) {
        setAppLogs(prev => {
          const next = gw.LastAppsData.map(app => ({
            id:     app.appid,
            name:   app.name ?? `App #${app.appid}`,
            detail: `${app.saveType || 'unknown'} · ${app.Reason || 'unknown'}`,
            prog:   'Saved',
            type:   'success',
            time:   new Date().toLocaleTimeString(),
          }))
          /* deduplicate by appid against what we have */
          const existing = new Set(prev.map(e => e.id))
          const fresh    = next.filter(e => !existing.has(e.id))
          return [...fresh, ...prev].slice(0, 100)
        })
      }
    }
  }, [metrics])

  const handleStart = useCallback(() => {
    if (isRunning) {
      setIsRunning(false)
      fetch(`${API_BASE}/api/siri0/games/stop`, {
        method: 'POST', credentials: 'include', headers: csrfHeader(),
      }).catch(() => {})
      return
    }
    setIsRunning(true)
    fetch(`${API_BASE}/api/siri0/games/start`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...csrfHeader() },
      body: JSON.stringify({ mode: crawlerMode }),
    }).catch(() => setIsRunning(false))
  }, [crawlerMode, isRunning])

  const anyRunning = fetcher.RefreshRunning || syncResume.SyncRunning || gamesWorker.WorkerRunning

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
        <div className={`status-indicator ${anyRunning ? 'active' : ''}`} />
      </div>

      <StatusBanner
        refreshRunning={fetcher.RefreshRunning}
        syncRunning={syncResume.SyncRunning}
        workerRunning={gamesWorker.WorkerRunning}
      />

      {/* top 3 cards */}
      <div className="cw-top-row">
        <RefreshCard fetcher={fetcher} />
        <SyncCard    sync={syncResume} />
        <WorkerCard  worker={gamesWorker} />
      </div>

      {/* control panel + terminals */}
      <ControlPanel
        isRunning={isRunning}
        crawlerMode={crawlerMode}
        setCrawlerMode={setCrawlerMode}
        onStart={handleStart}
        statusMsg={statusMsg}
        appLogs={appLogs}
        sysLogs={sysLogs}
        clearLogs={() => { setAppLogs([]); setSysLogs([]); }}
      />
    </div>
  )
}
