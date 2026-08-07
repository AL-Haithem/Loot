import { useState, useEffect } from 'react'

const DEFAULT_FILTERS = {
  KEEP_ALIVE: false,
  Total: 0,
  StartedAt: null,
  FinishedAt: null,
  Duration: 0,
  LastRun: null,
  NextRun: null,
  ExchangeUpdatedAt: null,
  Status: "Idle",
  Filters: { cheapest: 0, popularPaid: 0, newest: 0, popularFree: 0 },
  Logs: [],
  LastError: null
}

/* ── Helpers ─────────────────────────────────────────── */
function formatDate(ms) {
  if (!ms) return 'N/A'
  const d = new Date(ms)
  if (isNaN(d.getTime())) return 'N/A'
  return d.toLocaleString('ar-MA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  })
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return '00m 00s'
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0')
  const s = (totalSec % 60).toString().padStart(2, '0')
  return `${m}m ${s}s`
}

/* Countdown hook */
function useCountdown(targetMs) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    if (!targetMs) { setRemaining(null); return }

    const tick = () => {
      const diff = targetMs - Date.now()
      if (diff <= 0) { setRemaining('Now'); return }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1000)
      const parts = []
      if (h > 0) parts.push(`${h}h`)
      if (m > 0) parts.push(`${m}m`)
      parts.push(`${s}s`)
      setRemaining(parts.join(' '))
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetMs])

  return remaining
}

/* ── Main Component ──────────────────────────────────── */
export default function GamesFilters({ isActive, metrics }) {
  // The SSE key from the server is 'Filters' (not 'FiltersRefresh')
  const filters = metrics?.Filters || DEFAULT_FILTERS

  const {
    KEEP_ALIVE, Total, StartedAt, FinishedAt, Duration,
    LastRun, NextRun, ExchangeUpdatedAt, Status,
    Filters, Logs, LastError
  } = filters

  const countdown = useCountdown(NextRun)

  if (!isActive) return null

  return (
    <div className="section active" id="games-filters">

      {/* HEADER */}
      <div className="section-header">
        <div className="header-titles">
          <h2>
            <i className="fas fa-filter" />
            Games Filters Engine
          </h2>
          <span className="subtitle">Store filters cache builder and statistics</span>
        </div>

        {/* KEEP_ALIVE visual indicator */}
        <div className="gf-status-indicator">
          <span className={`gf-pulse-dot ${KEEP_ALIVE ? 'online' : 'offline'}`} />
          <span className="gf-status-text">{KEEP_ALIVE ? 'System Online' : 'System Offline'}</span>
        </div>
      </div>

      <div className="gf-content">

        {/* ── GROUP 1: Execution Stats ─────────────────── */}
        <div className="gf-group">
          <h3 className="gf-group-title"><i className="fas fa-cogs" /> Execution Statistics</h3>
          <div className="gf-stats-grid">

            <div className="gf-stat-card">
              <span className="gf-stat-label"><i className="fas fa-info-circle" /> Status</span>
              <span className="gf-stat-value" style={{ color: KEEP_ALIVE ? 'var(--clr-success)' : 'var(--text-muted)' }}>
                {Status || 'Idle'}
              </span>
            </div>

            <div className="gf-stat-card">
              <span className="gf-stat-label"><i className="fas fa-barcode" /> Total Processed</span>
              <span className="gf-stat-value primary">{Total.toLocaleString()}</span>
            </div>

            <div className="gf-stat-card">
              <span className="gf-stat-label"><i className="fas fa-stopwatch" /> Duration</span>
              <span className="gf-stat-value">{formatDuration(Duration)}</span>
            </div>

            <div className="gf-stat-card">
              <span className="gf-stat-label"><i className="fas fa-exchange-alt" /> Exchange Updated</span>
              <span className="gf-stat-value" style={{ fontSize: '0.95rem' }}>{formatDate(ExchangeUpdatedAt)}</span>
            </div>

            <div className="gf-stat-card">
              <span className="gf-stat-label"><i className="fas fa-play" /> Started At</span>
              <span className="gf-stat-value" style={{ fontSize: '0.95rem' }}>{formatDate(StartedAt)}</span>
            </div>

            <div className="gf-stat-card">
              <span className="gf-stat-label"><i className="fas fa-stop" /> Finished At</span>
              <span className="gf-stat-value" style={{ fontSize: '0.95rem' }}>{formatDate(FinishedAt)}</span>
            </div>

            <div className="gf-stat-card">
              <span className="gf-stat-label"><i className="fas fa-history" /> Last Run</span>
              <span className="gf-stat-value" style={{ fontSize: '0.95rem' }}>{formatDate(LastRun)}</span>
            </div>

            {/* Next run + countdown */}
            <div className="gf-stat-card gf-nextrun-card">
              <span className="gf-stat-label"><i className="fas fa-calendar-alt" /> Next Run</span>
              <span className="gf-stat-value" style={{ fontSize: '0.95rem' }}>{formatDate(NextRun)}</span>
              {countdown && (
                <span className="gf-countdown">
                  <i className="fas fa-hourglass-half" /> {countdown}
                </span>
              )}
            </div>

          </div>
        </div>

        {/* ── GROUP 2: Filter Cache Results ────────────── */}
        <div className="gf-group">
          <h3 className="gf-group-title"><i className="fas fa-cubes" /> Active Filters Cache</h3>
          <div className="gf-filters-grid">
            <div className="gf-filter-card">
              <i className="fas fa-wallet icon" style={{ color: '#f87171' }} />
              <div className="gf-f-val">{(Filters?.cheapest ?? 0).toLocaleString()}</div>
              <div className="gf-f-lbl">Cheapest</div>
            </div>
            <div className="gf-filter-card">
              <i className="fas fa-star icon" style={{ color: '#fbbf24' }} />
              <div className="gf-f-val">{(Filters?.popularPaid ?? 0).toLocaleString()}</div>
              <div className="gf-f-lbl">Popular Paid</div>
            </div>
            <div className="gf-filter-card">
              <i className="fas fa-fire icon" style={{ color: '#f97316' }} />
              <div className="gf-f-val">{(Filters?.newest ?? 0).toLocaleString()}</div>
              <div className="gf-f-lbl">Newest Paid</div>
            </div>
            <div className="gf-filter-card">
              <i className="fas fa-gift icon" style={{ color: '#34d399' }} />
              <div className="gf-f-val">{(Filters?.popularFree ?? 0).toLocaleString()}</div>
              <div className="gf-f-lbl">Popular Free</div>
            </div>
          </div>
        </div>

        {/* ── GROUP 3: Logs & Errors ───────────────────── */}
        <div className="gf-terminals-row">

          {/* Logs Terminal */}
          <div className="gf-terminal">
            <div className="gf-terminal-head">
              <i className="fas fa-terminal" /> Engine Logs
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#666' }}>
                {Logs?.length ?? 0} entries
              </span>
            </div>
            <div className="gf-terminal-body">
              {Logs && Logs.length > 0 ? (
                [...Logs].reverse().map((log, i) => {
                  let timeStr = 'N/A'
                  let msg = String(log)
                  if (typeof log === 'object' && log !== null) {
                    timeStr = log.time ? new Date(log.time).toLocaleTimeString() : 'N/A'
                    msg = log.message || JSON.stringify(log)
                  }
                  return (
                    <div key={i} className="gf-log-line">
                      <span className="gf-log-time">[{timeStr}]</span>
                      <span className="gf-log-msg">{msg}</span>
                    </div>
                  )
                })
              ) : (
                <div className="gf-terminal-empty">No logs received yet…</div>
              )}
            </div>
          </div>

          {/* Last Error */}
          <div className="gf-terminal error-terminal">
            <div className="gf-terminal-head" style={{ color: 'var(--clr-error)' }}>
              <i className="fas fa-exclamation-triangle" /> Last Error
            </div>
            <div className="gf-terminal-body">
              {LastError ? (
                <div className="gf-log-line">
                  <span className="gf-log-time">
                    [{LastError.time ? new Date(LastError.time).toLocaleString() : 'N/A'}]
                  </span>
                  <span className="gf-log-msg error-msg">
                    {LastError.message || String(LastError)}
                  </span>
                </div>
              ) : (
                <div className="gf-terminal-empty success-msg">
                  <i className="fas fa-check-circle" /> No recent errors — engine is healthy.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
