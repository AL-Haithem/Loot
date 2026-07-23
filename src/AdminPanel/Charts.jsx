/**
 * Shared chart components for Admin Panel.
 * Includes: GaugeDonut (SVG), Sparkline, Histogram, StackedArea, LogTimeline
 */
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend
} from 'recharts'

// ─── Shared tooltip style ────────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'rgba(13,17,30,0.95)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.8rem'
  }
}

// ─── 1. Gauge / Arc (pure SVG) ───────────────────────────────────────────────
/**
 * @param {number}  percent   0–1
 * @param {string}  label
 * @param {string}  value     display text in center
 * @param {string[]} colors   [low, mid, high] — gradient stops
 */
export function GaugeDonut({ percent = 0, label = '', value = '', colors = ['#10b981', '#fbbf24', '#ef4444'] }) {
  const safe = Math.min(1, Math.max(0, isNaN(percent) ? 0 : percent))

  // SVG arc math — half‑circle (180°)
  const r = 50            // radius
  const cx = 70, cy = 60 // centre
  const sweepAngle = Math.PI * safe

  const toXY = (angle) => ({
    x: cx + r * Math.cos(angle),
    y: cy - r * Math.sin(angle)
  })

  // Start at left (Math.PI) and go clockwise towards right (Math.PI - sweepAngle)
  const start = toXY(Math.PI)
  const end   = toXY(Math.PI - sweepAngle)

  // pick colour
  const pickColor = (t) => {
    if (t < 0.5) return colors[0]
    if (t < 0.8) return colors[1]
    return colors[2]
  }

  const arcColor = pickColor(safe)
  const gradId   = `gauge-grad-${label.replace(/[^a-zA-Z0-9]/g, '-')}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <svg width="140" height="85" viewBox="0 0 140 85" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="60%" stopColor={colors[1]} />
            <stop offset="100%" stopColor={colors[2]} />
          </linearGradient>
        </defs>

        {/* Background track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Value arc */}
        {safe > 0 && (
          <path
            d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="10"
            strokeLinecap="round"
          />
        )}

        {/* Needle dot */}
        <circle cx={end.x} cy={end.y} r="5" fill={arcColor} />

        {/* Centre value text */}
        <text x={cx} y={cy + 15} textAnchor="middle" fill="#f1f5f9" fontSize="16" fontWeight="700">
          {value}
        </text>
      </svg>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', maxWidth: '130px' }}>
        {label}
      </span>
    </div>
  )
}

// ─── 2. Sparkline ────────────────────────────────────────────────────────────
/**
 * @param {Array<{t: string|number, v: number}>} data
 * @param {string} color
 */
export function Sparkline({ data = [], color = '#00f0ff', height = 50 }) {
  if (!data.length) return <span style={{ fontSize: '0.75rem', color: '#475569' }}>No data</span>

  const chartData = data.map(d => ({ t: d.t, v: typeof d.v === 'number' ? d.v : 0 }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <RechartsTooltip
          {...tooltipStyle}
          labelFormatter={() => ''}
          formatter={(v) => [v, '']}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── 3. Histogram (vertical bar chart) ──────────────────────────────────────
/**
 * @param {Array<{label: string, value: number}>} data
 * @param {string} color
 * @param {Function} tickFormatter   optional y-axis formatter
 */
export function Histogram({ data = [], color = '#8b5cf6', height = 180, tickFormatter }) {
  const chartData = data.map(d => ({ label: d.label, value: typeof d.value === 'number' ? d.value : 0 }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={tickFormatter}
        />
        <RechartsTooltip {...tooltipStyle} formatter={(v) => [tickFormatter ? tickFormatter(v) : v, 'Value']} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── 4. Stacked Area (Read vs Write) ────────────────────────────────────────
/**
 * @param {Array<{t: string, reads: number, writes: number}>} data
 */
export function StackedArea({ data = [], height = 200 }) {
  if (!data.length) return <span style={{ fontSize: '0.8rem', color: '#475569' }}>No data</span>

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="gradReads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradWrites" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ff0055" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#ff0055" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <RechartsTooltip {...tooltipStyle} />
        <Legend
          wrapperStyle={{ paddingTop: '10px', fontSize: '0.78rem', color: '#94a3b8' }}
        />
        <Area
          type="monotone"
          dataKey="reads"
          name="Reads"
          stroke="#00f0ff"
          strokeWidth={2}
          fill="url(#gradReads)"
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="writes"
          name="Writes"
          stroke="#ff0055"
          strokeWidth={2}
          fill="url(#gradWrites)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── 5. Log Timeline ────────────────────────────────────────────────────────
const LOG_TYPE_COLOR = {
  error:   '#f87171',
  warning: '#fbbf24',
  success: '#10b981',
  info:    '#3b82f6',
}

/**
 * @param {string[]} logs   raw log lines from SSE (Logs section)
 */
export function LogTimeline({ logs = [] }) {
  if (!logs.length) {
    return (
      <div style={{ color: '#475569', fontSize: '0.8rem', textAlign: 'center', padding: '20px 0' }}>
        No log events to display
      </div>
    )
  }

  const getType = (line) => {
    if (line.includes('ERROR') || line.includes('❌')) return 'error'
    if (line.includes('WARNING') || line.includes('⚠️')) return 'warning'
    if (line.includes('SUCCESS') || line.includes('✅')) return 'success'
    return 'info'
  }

  // Show last 50 entries, newest first
  const entries = [...logs].reverse().slice(0, 50)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', paddingLeft: '28px' }}>
      {/* vertical line */}
      <div style={{
        position: 'absolute', left: '10px', top: 0, bottom: 0,
        width: '2px', background: 'rgba(255,255,255,0.07)', borderRadius: '1px'
      }} />

      {entries.map((line, i) => {
        const type  = getType(line)
        const color = LOG_TYPE_COLOR[type] || '#64748b'
        // Try to parse a timestamp prefix like "[HH:MM:SS]" or "2026-…"
        const timeMatch = line.match(/\[?(\d{1,2}:\d{2}:\d{2})\]?/) || line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/)
        const time = timeMatch ? timeMatch[1] : null
        const text = line.replace(/^\S+\s+/, '') // strip leading timestamp token

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '6px 0', position: 'relative' }}>
            {/* dot */}
            <div style={{
              position: 'absolute', left: '-22px', top: '10px',
              width: '10px', height: '10px', borderRadius: '50%',
              background: color, boxShadow: `0 0 6px ${color}55`, flexShrink: 0
            }} />
            <div style={{ flex: 1 }}>
              {time && (
                <span style={{ fontSize: '0.7rem', color: '#475569', marginRight: '8px', fontFamily: 'monospace' }}>{time}</span>
              )}
              <span style={{ fontSize: '0.8rem', color, wordBreak: 'break-all' }}>{text || line}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
