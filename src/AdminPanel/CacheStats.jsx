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
    const totalStorage = extractValue(data.total_monthly_storage) || (currStorage * 1.5) || 1024*1024*1024; // fallback for gauge
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
    let totalKeys = 0;
    let expires = 0;
    let avgTtl = 0;
    if (data.keyspace && data.keyspace.db0) {
      totalKeys = data.keyspace.db0.keys || 0;
      expires = data.keyspace.db0.expires || 0;
      avgTtl = data.keyspace.db0.avg_ttl || 0;
    }
    const persistent = Math.max(0, totalKeys - expires);

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
    addTimeSeries(data.dailybandwidth, 'bandwidth');
    addTimeSeries(data.dailybilling, 'billing');
    const dailyActivity = Array.from(activityMap.values()).sort((a, b) => a.time.localeCompare(b.time));

    // Radar Data
    const radarData = [
      { subject: 'Storage', A: Math.min(100, (currStorage / (totalStorage || 1)) * 100), fullMark: 100 },
      { subject: 'Bandwidth', A: 75, fullMark: 100 },
      { subject: 'Requests', A: 85, fullMark: 100 },
      { subject: 'Reads', A: totalCache > 0 ? (reads / totalCache) * 100 : 50, fullMark: 100 },
      { subject: 'Writes', A: totalCache > 0 ? (writes / totalCache) * 100 : 50, fullMark: 100 },
    ];

    return {
      currStorage, totalStorage, storagePercent,
      hits, misses, hitRate,
      reads, writes,
      topCommands: top10,
      pieCommands,
      totalKeys, expires, avgTtl, persistent,
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
                <TimeSeriesChart data={data.diskusage} color="#00f0ff" name="Storage (B)" />
              </div>
            </div>

            <div className="card-glass dashboard-group">
              <div className="group-title"><i className="fas fa-wifi"></i> Bandwidth Trend</div>
              <div className="stats-mini-grid" style={{ marginBottom: '15px' }}>
                <StatCard label="Today" value={formatBytes(extractSum(data.dailybandwidth))} />
                <StatCard label="This Month" value={formatBytes(extractValue(data.total_monthly_bandwidth))} />
              </div>
              <div style={{ width: '100%', height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={extractArray(data.dailybandwidth)} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBw" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff0055" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ff0055" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val) => (val/1024/1024).toFixed(1) + 'M'} />
                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(13,17,30,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="value" name="Bandwidth" stroke="#ff0055" strokeWidth={3} fillOpacity={1} fill="url(#colorBw)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 4 & 5. REQUESTS & CACHE PERFORMANCE */}
          <div className="dashboard-grid two-cols">
            <div className="card-glass dashboard-group">
              <div className="group-title"><i className="fas fa-hand-pointer"></i> Traffic (Read vs Write)</div>
              
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ flex: 1, height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: 'Reads', value: processedData.reads },
                        { name: 'Writes', value: processedData.writes }
                      ]} innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                        <Cell fill="#00f0ff" />
                        <Cell fill="#ff0055" />
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(13,17,30,0.9)', borderColor: 'rgba(255,255,255,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1 }}>
                  <StatCard label="Today's Reads" value={formatNum(processedData.reads)} />
                  <br/>
                  <StatCard label="Today's Writes" value={formatNum(processedData.writes)} />
                  <br/>
                  <StatCard label="Total Requests" value={formatNum(extractValue(data.dailyrequests))} />
                </div>
              </div>
            </div>

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
          </div>

          {/* 7. COMMANDS */}
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

          {/* 8, 9, 6. KEYSPACE & MONTHLY & CONNECTIONS */}
          <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            
            <div className="card-glass dashboard-group">
              <div className="group-title"><i className="fas fa-key"></i> Keyspace (db0)</div>
              <div className="stats-mini-grid" style={{ gridTemplateColumns: '1fr' }}>
                <StatCard label="Total Keys" value={formatNum(processedData.totalKeys)} />
                <StatCard label="Average TTL" value={`${formatNum(processedData.avgTtl)} ms`} />
              </div>
              <div style={{ height: '160px', marginTop: '15px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[
                      { name: 'Persistent', value: processedData.persistent },
                      { name: 'Expiring', value: processedData.expires }
                    ]} innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                      <Cell fill="#3b82f6" />
                      <Cell fill="#fbbf24" />
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(13,17,30,0.9)', borderColor: 'rgba(255,255,255,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

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
              <div className="group-title"><i className="fas fa-plug"></i> Connections & Billing</div>
              <div className="stats-mini-grid" style={{ gridTemplateColumns: '1fr' }}>
                <StatCard label="TCP Connections" value={extractValue(data.connection_count)} />
                <StatCard label="REST Connections" value={extractValue(data.rest_conn_count)} />
                <StatCard label="Today's Cost" value={`$${extractSum(data.dailybilling)}`} />
                
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Connection Load</div>
                  <div className="progress-outer" style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                    <div className="progress-inner" style={{ width: `${Math.min(100, (extractValue(data.connection_count) / 100) * 100)}%`, background: 'linear-gradient(90deg, #10b981, #3b82f6)', height: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 10. DAILY ACTIVITY */}
          <div className="card-glass dashboard-group">
            <div className="group-title"><i className="fas fa-chart-line"></i> Daily Activity Timeline</div>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedData.dailyActivity} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNum(v)} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatBytes(v)} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(13,17,30,0.9)', borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="requests" stroke="#00f0ff" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="bandwidth" stroke="#ff0055" strokeWidth={2} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="billing" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
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
  else if (Array.isArray(val) && val.length > 0) {
    const last = val[val.length - 1];
    if (last && typeof last.y === 'number') num = last.y;
  } else if (typeof val === 'string') num = parseFloat(val) || 0;
  return num;
}

function extractSum(val) {
  if (typeof val === 'number') return val;
  if (!Array.isArray(val)) return 0;
  return val.reduce((acc, curr) => acc + (curr.y || 0), 0);
}

function extractArray(val) {
  if (!Array.isArray(val)) return [];
  return val.map(d => {
    let shortTime = d.x;
    try {
      if (typeof d.x === 'string' && d.x.includes(' ')) {
        const timePart = d.x.split(' ')[1];
        shortTime = timePart.split('.')[0];
      }
    } catch(e) {}
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

function TimeSeriesChart({ data, color, name }) {
  const parsed = extractArray(data);
  if (parsed.length === 0) return <div style={{ fontSize: '0.8rem', color: '#64748b' }}>No data</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={parsed} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={`color${name}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatBytes(v)} />
        <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(13,17,30,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
        <Area type="monotone" dataKey="value" name={name} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color${name})`} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
