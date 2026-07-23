import { useState } from 'react'
import { LogTimeline } from './Charts.jsx'

function escapeHtml(text) {
  if (typeof text !== 'string') return text
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export default function Logs({ isActive, metrics }) {
  const logs = metrics?.Logs || metrics?.SystemLogs || metrics?.logs || [];
  const [viewMode, setViewMode] = useState('terminal') // 'terminal' | 'timeline'

  const getLogClass = (line) => {
    if (line.includes('ERROR') || line.includes('❌')) return 'log-line error'
    if (line.includes('WARNING') || line.includes('⚠️')) return 'log-line warning'
    if (line.includes('SUCCESS') || line.includes('✅')) return 'log-line success'
    return 'log-line'
  }

  if (!isActive) return null;

  return (
    <div id="logs" className="section active">
      <div className="section-header">
        <h2>
          <i className="fas fa-terminal" /> System Terminal
        </h2>
        {/* View toggle */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setViewMode('terminal')}
            style={{
              padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
              background: viewMode === 'terminal' ? 'var(--accent-clr, #00f0ff)' : 'rgba(255,255,255,0.07)',
              color: viewMode === 'terminal' ? '#000' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            <i className="fas fa-terminal" style={{ marginRight: '5px' }} />Terminal
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            style={{
              padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
              background: viewMode === 'timeline' ? 'var(--accent-clr, #00f0ff)' : 'rgba(255,255,255,0.07)',
              color: viewMode === 'timeline' ? '#000' : '#94a3b8',
              transition: 'all 0.2s'
            }}
          >
            <i className="fas fa-stream" style={{ marginRight: '5px' }} />Timeline
          </button>
        </div>
      </div>

      {viewMode === 'terminal' ? (
        <div className="logs-wrapper shadow-soft card-glass" style={{
          background: '#0a0a0a', 
          border: '1px solid #333', 
          fontFamily: '"Fira Code", monospace',
          padding: 0
        }}>
          <div className="logs-feed-header" style={{
            background: '#1a1a1a', 
            padding: '12px 16px', 
            borderBottom: '1px solid #333', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{color: '#a3a3a3', fontSize: '0.9rem'}}><i className="fas fa-server" style={{marginRight: '8px'}} /> /var/log/system.log (Live)</span>
            <div style={{display: 'flex', gap: '8px'}}>
              <div style={{width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56'}}></div>
              <div style={{width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e'}}></div>
              <div style={{width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f'}}></div>
            </div>
          </div>
          <div className="activity-feed" style={{
            padding: '16px', 
            maxHeight: '600px', 
            overflowY: 'auto',
            fontSize: '0.85rem',
            lineHeight: '1.6'
          }}>
            {!metrics ? (
              <div className="log-line" style={{color: '#a3a3a3'}}>&gt; Connecting to log stream...</div>
            ) : logs.length === 0 ? (
              <div className="log-line" style={{color: '#a3a3a3'}}>&gt; No logs available in the current stream.</div>
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
      ) : (
        <div className="card-glass" style={{ padding: '20px', maxHeight: '650px', overflowY: 'auto' }}>
          <LogTimeline logs={logs} />
        </div>
      )}
    </div>
  )
}
