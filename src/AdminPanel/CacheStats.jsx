import { useMemo } from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'

const COLORS = ['#00f0ff', '#ff0055', '#10b981', '#fbbf24', '#8b5cf6', '#3b82f6'];

export default function CacheStats({ isActive, metrics }) {
  const data = metrics?.Cache || null;

  const processedData = useMemo(() => {
    if (!data) return null;
    
    const currStorage = extractValue(data.current_storage);
    const totalStorage = extractValue(data.total_monthly_storage) || (currStorage * 1.5) || 1024*1024*1024;
    const storagePercent = totalStorage > 0 ? ((currStorage / totalStorage) * 100).toFixed(1) : 0;

    const hits = extractValue(data.hits);
    const misses = extractValue(data.misses);
    const totalCache = hits + misses;
    const hitRate = totalCache > 0 ? ((hits / totalCache) * 100).toFixed(1) : 0;

    const reads = extractValue(data.daily_read_requests);
    const writes = extractValue(data.daily_write_requests);

    // Commands
    let topCommands = [];
    if (Array.isArray(data.command_counts)) {
      topCommands = data.command_counts.map(c => ({
        name: String(c.metric_identifier || 'CMD').toUpperCase(),
        value: extractValue(c.data_points)
      })).sort((a, b) => b.value - a.value);
    }
    const top10 = topCommands.slice(0, 10);
    const otherCmds = topCommands.slice(10).reduce((acc, curr) => acc + curr.value, 0);
    const pieCommands = [...topCommands.slice(0, 5)];
    if (otherCmds > 0) pieCommands.push({ name: 'OTHER', value: otherCmds });

    // Keyspace
    const totalKeys = extractValue(data.keyspace);

    // Merge for Daily Activity
    const activityMap = new Map();
    const addTimeSeries = (series, key) => {
      extractArray(series).forEach(d => {
        const entry = activityMap.get(d.time) || { time: d.time };
        entry[key] = d.value;
        activityMap.set(d.time, entry);
      });
    };
    addTimeSeries(data.dailyrequests, 'requests');
    addTimeSeries(data.dailybilling, 'billing');
    const dailyActivity = Array.from(activityMap.values()).sort((a, b) => a.time.localeCompare(b.time));

    // Radar Data
    const radarData = [
      { subject: 'Storage', A: Math.min(100, (currStorage / (totalStorage || 1)) * 100), fullMark: 100 },
      { subject: 'Bandwidth', A: totalCache > 0 ? 80 : 0, fullMark: 100 },
      { subject: 'Requests', A: totalCache > 0 ? 90 : 0, fullMark: 100 },
      { subject: 'Reads', A: totalCache > 0 ? (reads / totalCache) * 100 : 50, fullMark: 100 },
      { subject: 'Writes', A: totalCache > 0 ? (writes / totalCache) * 100 : 50, fullMark: 100 },
    ];

    return {
      currStorage, totalStorage, storagePercent,
      hits, misses, hitRate,
      reads, writes,
      topCommands: top10,
      pieCommands,
      totalKeys,
      dailyActivity,
      radarData
    };
  }, [data]);

  if (!isActive) return null;

  return (
    <div id="cache" className="section active">
      <div className="section-header" style={{ marginBottom: '30px' }}>
        <h2>
          <i className="fas fa-server"></i> Redis Cache Dashboard
          <span className="subtitle">Real-time Performance & Usage Metrics</span>
        </h2>
      </div>

      {!data ? (
        <div className="settings-message" style={{position:'static', transform:'none', margin:'20px 0'}}>
          <i className="fas fa-spinner fa-pulse" style={{marginRight: '8px'}} /> Waiting for Cache metrics stream...
        </div>
      ) : (
        <div className="cache-dashboard-layout">
          
          {/* 1. OVERVIEW */}
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <StatCard icon="fas fa-hdd" label="Current Storage" value={formatBytes(processedData.currStorage)} highlight />
            <StatCard icon="fas fa-network-wired" label="Monthly Bandwidth" value={formatBytes(extractValue(data.total_monthly_bandwidth))} highlight />
            <StatCard icon="fas fa-exchange-alt" label="Monthly Requests" value={formatNum(extractValue(data.total_monthly_requests))} highlight />
            <StatCard icon="fas fa-plug" label="Connections" value={extractValue(data.connection_count)} highlight />
            <StatCard icon="fas fa-bolt" label="Hit Rate" value={`${processedData.hitRate}%`} highlight />
          </div>

          {/* 2 & 3. STORAGE & BANDWIDTH */}
          <div className="dashboard-grid two-cols">
            <div className="card-glass dashboard-group">
              <div className="group-title"><i className="fas fa-database"></i> Storage Growth</div>
              
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span>Usage: {formatBytes(processedData.currStorage)} / {formatBytes(processedData.totalStorage)}</span>
                  <span style={{ color: 'var(--accent-primary)' }}>{processedData.storagePercent}%</span>
                </div>
                <div className="progress-outer" style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div className="progress-inner" style={{ width: `${processedData.storagePercent}%`, background: 'linear-gradient(90deg, var(--accent-primary), #0066ff)', height: '100%' }} />
                </div>
              </div>
              
              <div style={{ width: '100%', height: '200px' }}>
                <TimeSeriesChart data={data.diskusage} color="#00f0ff" name="Storage (B)" isBytes={true} />
              </div>
            </div>

            <div className="card-glass dashboard-group">
              <div className="group-title"><i className="fas fa-hand-pointer"></i> Traffic (Read vs Write)</div>
              
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '10px' }}>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ height: '140px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 5, left: 10, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily</div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          { name: 'Reads', value: processedData.reads },
                          { name: 'Writes', value: processedData.writes }
                        ]} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                          <Cell fill="#00f0ff" />
                          <Cell fill="#ff0055" />
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(13,17,30,0.9)', borderColor: 'rgba(255,255,255,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div style={{ height: '140px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 5, left: 10, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monthly</div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          { name: 'M. Reads', value: extractValue(data.total_monthly_read_requests) },
                          { name: 'M. Writes', value: extractValue(data.total_monthly_write_requests) }
                        ]} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                          <Cell fill="#3b82f6" />
                          <Cell fill="#f59e0b" />
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(13,17,30,0.9)', borderColor: 'rgba(255,255,255,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <StatCard label="Today's Reads" value={formatNum(processedData.reads)} />
                  <br/>
                  <StatCard label="Today's Writes" value={formatNum(processedData.writes)} />
                  <br/>
                  <StatCard label="Monthly Reads" value={formatNum(extractValue(data.total_monthly_read_requests))} />
                  <br/>
                  <StatCard label="Monthly Writes" value={formatNum(extractValue(data.total_monthly_write_requests))} />
                </div>
              </div>
            </div>
          </div>

          {/* CACHE HIT RATE & INFRASTRUCTURE */}
          <div className="dashboard-grid two-cols">
            <div className="card-glass dashboard-group">
              <div className="group-title"><i className="fas fa-bullseye"></i> Hit Rate Performance</div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <StatCard label="Cache Hits" value={formatNum(processedData.hits)} />
                  <br/>
                  <StatCard label="Cache Misses" value={formatNum(processedData.misses)} />
                  <br/>
                  <div className="stat-card-modern" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    <span className="label" style={{ color: '#10b981' }}>Hit Rate</span>
                    <span className="value" style={{ color: '#10b981', fontSize: '1.8rem' }}>{processedData.hitRate}%</span>
                  </div>
                </div>
                <div style={{ flex: 1, height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: 'Hits', value: processedData.hits },
                        { name: 'Misses', value: processedData.misses }
                      ]} innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                        <Cell fill="#10b981" />
                        <Cell fill="#f87171" />
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(13,17,30,0.9)', borderColor: 'rgba(255,255,255,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="card-glass dashboard-group">
              <div className="group-title"><i className="fas fa-key"></i> Infrastructure & Network</div>
              <div className="stats-mini-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                <StatCard label="Total Keyspace" value={formatNum(processedData.totalKeys)} />
                <StatCard label="TCP Connections" value={extractValue(data.connection_count)} />
                <StatCard label="REST Connections" value={extractValue(data.rest_conn_count)} />
                <StatCard label="Daily Bandwidth" value={formatBytes(data.dailybandwidth)} />
                <StatCard label="Daily Commands" value={formatNum(data.daily_net_commands)} />
              </div>
            </div>
          </div>

          {/* COMMANDS */}
          <div className="card-glass dashboard-group">
            <div className="group-title"><i className="fas fa-terminal"></i> Command Distribution</div>
            <div className="dashboard-grid" style={{ gridTemplateColumns: '1.5fr 1fr 1.5fr' }}>
              
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedData.topCommands} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#fff', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(13,17,30,0.9)', borderColor: 'rgba(255,255,255,0.1)' }} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                      {processedData.topCommands.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={processedData.pieCommands} outerRadius={100} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {processedData.pieCommands.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(13,17,30,0.9)', borderColor: 'rgba(255,255,255,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="cmd-table-wrap" style={{ overflowY: 'auto', paddingRight: '10px', height: '300px' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '10px', color: 'var(--text-secondary)' }}>Command</th>
                      <th style={{ padding: '10px', color: 'var(--text-secondary)' }}>Executions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedData.topCommands.map((cmd, i) => (
                      <tr key={cmd.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: COLORS[i % COLORS.length] }}>{cmd.name}</td>
                        <td style={{ padding: '10px' }}>{formatNum(cmd.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          {/* RADAR & DAILY ACTIVITY */}
          <div className="dashboard-grid two-cols">
            <div className="card-glass dashboard-group">
              <div className="group-title"><i className="fas fa-radar"></i> Usage Radar</div>
              <div style={{ height: '280px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={processedData.radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Metrics" dataKey="A" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.3} />
                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(13,17,30,0.9)', borderColor: 'rgba(255,255,255,0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-glass dashboard-group">
              <div className="group-title">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><i className="fas fa-chart-line"></i> Daily Activity & Cost</span>
                </div>
              </div>
              <div style={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={processedData.dailyActivity} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNum(v)} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => '$'+v} />
                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(13,17,30,0.9)', borderColor: 'rgba(255,255,255,0.1)' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="requests" stroke="#00f0ff" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="billing" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function extractValue(val) {
  let num = 0;
  if (typeof val === 'number') num = val;
  else if (val && typeof val === 'object' && !Array.isArray(val) && val.y !== undefined) num = val.y;
  else if (Array.isArray(val) && val.length > 0) {
    const last = val[val.length - 1];
    if (last && typeof last.y === 'number') num = last.y;
  } else if (typeof val === 'string') num = parseFloat(val) || 0;
  return num;
}


function extractArray(val) {
  if (!Array.isArray(val)) return [];
  return val.map(d => {
    let shortTime = d.x;
    try {
      if (typeof d.x === 'string' && d.x.includes(' ')) {
        const timePart = d.x.split(' ')[1];
        shortTime = timePart.split('.')[0]; // keep HH:MM:SS
      }
    } catch {}
    return { time: shortTime, value: typeof d.y === 'number' ? Number(d.y.toFixed(2)) : 0 };
  });
}

function formatBytes(num) {
  if (!num || num === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  if (i < 0) return '0 B';
  return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatNum(num) {
  if (!num || num === 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function StatCard({ icon, label, value, highlight }) {
  return (
    <div className={`stat-card-modern ${highlight ? 'highlight' : ''}`} style={highlight ? { background: 'rgba(0, 240, 255, 0.05)', borderColor: 'rgba(0, 240, 255, 0.2)' } : {}}>
      <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon && <i className={icon} style={{ color: highlight ? 'var(--accent-primary)' : 'inherit' }}></i>} 
        {label}
      </span>
      <span className="value" style={highlight ? { color: 'var(--text-primary)', fontSize: '1.6rem' } : {}}>{value}</span>
    </div>
  )
}

function TimeSeriesChart({ data, color, name, isBytes }) {
  const parsed = extractArray(data);
  if (parsed.length === 0) return <div style={{ fontSize: '0.8rem', color: '#64748b' }}>No data</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={parsed} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`color${name.replace(/\s+/g,'')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => isBytes ? formatBytes(v) : formatNum(v)} />
        <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(13,17,30,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
        <Area type="monotone" dataKey="value" name={name} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color${name.replace(/\s+/g,'')})`} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
