import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'

export default function SystemStats({ isActive, metrics, connectionStatus }) {

  if (!isActive) return null;

  return (
    <div className="section active">
      <div className="section-header">
        <h2>
          <i className="fas fa-microchip"></i>
          System Monitoring
          <span className="subtitle">Real-time server metrics stream via SSE</span>
        </h2>
        <div className="server-status-mini" style={{ padding: '6px 12px', background: 'var(--surface-color)', borderRadius: '20px' }}>
          <span className={`status-dot ${connectionStatus === 'connected' ? 'online' : connectionStatus === 'connecting' ? 'warning' : 'error'}`}></span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {connectionStatus === 'connected' ? 'Live Stream Active' : connectionStatus === 'connecting' ? 'Connecting...' : 'Stream Disconnected'}
          </span>
        </div>
      </div>

      {!metrics && connectionStatus === 'connecting' && <div className="loading-shimmer">Connecting to telemetry stream...</div>}
      
      {!metrics && connectionStatus === 'error' && (
        <div className="settings-message error" style={{position:'static', transform:'none', margin:'20px 0'}}>
          Failed to connect to the monitoring stream.
        </div>
      )}

      {metrics && (
        <div className="dashboard-grid">
          {Object.entries(metrics).map(([key, value]) => {
            // Skip non-system metrics that belong to other sections
            if (['Time', 'Cache', 'Crawler', 'Settings', 'Data', 'Logs'].includes(key)) return null;

            return (
              <div key={key} className="card-glass dashboard-group">
                <div className="group-title" style={{ textTransform: 'capitalize' }}>
                  <i className="fas fa-chart-bar"></i> {key.replace(/_/g, ' ')}
                </div>
                <div className="stats-mini-grid" style={{ gridTemplateColumns: typeof value === 'object' && value !== null ? 'repeat(auto-fit, minmax(140px, 1fr))' : '1fr' }}>
                  {renderMetricContent(value)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function renderMetricContent(value) {
  if (value === null || value === undefined) {
    return <StatCard label="Value" value="N/A" />;
  }
  
  if (typeof value === 'object' && !Array.isArray(value)) {
    // If the object is empty, show N/A
    if (Object.keys(value).length === 0) {
      return <StatCard label="Status" value="Waiting for data..." />;
    }

    return Object.entries(value).map(([k, v]) => {
      let formattedValue = String(v);
      if (typeof v === 'number') {
        formattedValue = v % 1 !== 0 ? v.toFixed(2) : String(v);
      }
      
      // Formatting for top-level keys inside sections (System.Uptime, Http.AverageResponseTime, etc)
      if (k === 'Uptime' && typeof v === 'number') {
        const h = Math.floor(v / 3600);
        const m = Math.floor((v % 3600) / 60);
        const s = Math.floor(v % 60);
        formattedValue = `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
      } else if (k === 'CPU' && typeof v === 'number') {
        formattedValue = `${v.toFixed(1)}%`;
      } else if (k === 'AverageResponseTime') {
        formattedValue = `${typeof v === 'number' ? v.toFixed(2) : v} ms`;
      } else if (k === 'RSS' && typeof v === 'number') {
        formattedValue = (v / 1024 / 1024).toFixed(2) + ' MB';
      }
      
      // If the value itself is a nested object (like Http.StatusCodes or System.RAM)
      if (typeof v === 'object' && v !== null) {
        if (Object.keys(v).length === 0) return null; // hide empty nested objects

        // Render StatusCodes as a chart
        if (k === 'StatusCodes' || k === 'statusCodes') {
          return <StatusCodesChart key={k} data={v} />
        }

        return (
          <div key={k} style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', marginBottom: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'capitalize' }}>{k}</div>
            <div className="stats-mini-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
              {Object.entries(v).map(([subK, subV]) => {
                let subFormatted = String(subV);
                if (typeof subV === 'number') {
                  subFormatted = subV % 1 !== 0 ? subV.toFixed(2) : String(subV);
                }
                
                // Special formatting for sub-keys
                if (subK === 'Percent' && typeof subV === 'number') {
                  subFormatted = `${subV.toFixed(1)}%`;
                } else if (['Used', 'Free', 'Total', 'RSS'].includes(subK) || ['Used', 'Free', 'Total', 'RSS'].includes(k)) {
                   if (typeof subV === 'number' && subV > 1024) {
                     subFormatted = (subV / 1024 / 1024).toFixed(2) + ' MB';
                   }
                }
                return <StatCard key={subK} label={subK.replace(/_/g, ' ')} value={subFormatted} />
              })}
            </div>
          </div>
        )
      }

      return <StatCard key={k} label={k.replace(/_/g, ' ')} value={formattedValue} />
    });
  }
  
  return <StatCard label="Value" value={String(value)} />;
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card-modern">
      <span className="label" style={{ textTransform: 'capitalize' }}>{label}</span>
      <span className="value">{value}</span>
    </div>
  )
}

function StatusCodesChart({ data }) {
  const chartData = Object.entries(data).map(([code, count]) => ({
    code,
    count
  }));
  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#f43f5e', '#8b5cf6'];

  return (
    <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', marginBottom: '8px' }}>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px', textTransform: 'capitalize' }}>
        <i className="fas fa-chart-bar" style={{ marginRight: '8px' }}></i> Status Codes Distribution
      </div>
      <div style={{ width: '100%', height: '220px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="code" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(13,17,30,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
