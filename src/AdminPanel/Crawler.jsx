// Crawler section — adapted from Temp/Crawler.jsx
import { useState, useCallback, useEffect } from 'react'
import { API_BASE } from '../api.js'
import { csrfStore } from '../csrfStore.js'
import { GaugeDonut, Sparkline, Histogram } from './Charts.jsx'

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
  // History for sparkline (last 30 storage snapshots)
  const [storageHistory, setStorageHistory] = useState([])
  // Disk usage histogram from SSE
  const [diskHistData, setDiskHistData] = useState([])

  const csrfHeader = () => ({ 'X-CSRF-Token': csrfStore.get() ?? '' })

  // ── Sync with global SSE metrics ──
  useEffect(() => {
    if (!metrics) return;

    // The backend might send Crawler or Sync data in the future.
    // We handle it gracefully if it exists.
    const crawlerData = metrics.Crawler || metrics.crawler || metrics.CrawlerData;
    
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

      if (crawlerData.isRunning !== undefined) {
        setIsRunning(crawlerData.isRunning);
      }

      if (crawlerData.prog !== undefined) setProgress(crawlerData.prog);
      if (crawlerData.eta !== undefined) setTimeText(`${crawlerData.eta} remaining`);
      
      if (crawlerData.details) setStatusMsg(`Crawling: ${crawlerData.details}`);
      else if (crawlerData.text) setStatusMsg(crawlerData.text);

      // If there's a new log entry
      if (crawlerData.log) {
        setLogs(prev => {
          // avoid duplicate logs if the SSE pushes the same state multiple times
          if (prev.length > 0 && prev[0].id === crawlerData.log.id && prev[0].prog === crawlerData.log.prog) return prev;
          return [{ ...crawlerData.log, id: crawlerData.log.id || 'SYNC' }, ...prev].slice(0, 100);
        });
      }
    }

    // Also read diskusage from main Cache data for histogram
    const cacheData = metrics?.Cache;
    if (cacheData?.diskusage && Array.isArray(cacheData.diskusage)) {
      const hist = cacheData.diskusage.map(d => {
        let label = d.x || '';
        try {
          if (typeof d.x === 'string' && d.x.includes(' ')) label = d.x.split(' ')[1].split('.')[0];
        } catch {}
        return { label, value: typeof d.y === 'number' ? d.y : 0 };
      });
      setDiskHistData(hist);
    }

    // Update storage history for sparkline (track filled count over time)
    if (crawlerData?.Filled !== undefined) {
      setStorageHistory(prev => [
        ...prev.slice(-29),
        { t: new Date().toLocaleTimeString(), v: crawlerData.Filled }
      ]);
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
        <div className={`status-indicator ${isRunning ? 'active' : ''}`} />
      </div>

      {/* Gauge + Sparkline + Histogram row */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '20px' }}>
        {/* Storage Gauge */}
        <div className="card-glass dashboard-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
          <div className="group-title" style={{ marginBottom: '10px' }}>
            <i className="fas fa-hdd" /> Storage Progress
          </div>
          <GaugeDonut
            percent={stats.total > 0 ? stats.filled / stats.total : 0}
            label={`${stats.filled.toLocaleString()} / ${stats.total.toLocaleString()}`}
            value={`${stats.total > 0 ? ((stats.filled / stats.total) * 100).toFixed(1) : 0}%`}
            colors={['#10b981', '#fbbf24', '#ef4444']}
          />
        </div>

        {/* Filled progress Sparkline */}
        <div className="card-glass dashboard-group">
          <div className="group-title"><i className="fas fa-chart-line" /> Filled (Live)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px', color: '#f1f5f9' }}>
            {stats.filled.toLocaleString()}
          </div>
          <div style={{ height: '80px' }}>
            <Sparkline data={storageHistory} color="#10b981" height={80} />
          </div>
        </div>

        {/* Disk Usage Histogram */}
        <div className="card-glass dashboard-group">
          <div className="group-title"><i className="fas fa-chart-bar" /> Disk Usage Histogram</div>
          <Histogram
            data={diskHistData}
            color="#8b5cf6"
            height={120}
            tickFormatter={(v) => {
              if (v >= 1073741824) return (v / 1073741824).toFixed(1) + ' GB';
              if (v >= 1048576) return (v / 1048576).toFixed(1) + ' MB';
              if (v >= 1024) return (v / 1024).toFixed(1) + ' KB';
              return v + ' B';
            }}
          />
        </div>
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
