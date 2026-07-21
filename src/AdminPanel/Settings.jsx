// Settings section — adapted from Temp/Settings.jsx
import { useState, useEffect } from 'react'
import { useToast } from './Toast.jsx'
import { API_BASE } from '../api.js'
import { csrfStore } from '../csrfStore.js'

export default function Settings({ isActive }) {
  const showMessage   = useToast()
  const [siteName, setSiteName]             = useState('')
  const [siteDescription, setSiteDescription] = useState('')
  const [usdtPrice, setUsdtPrice]           = useState('')
  const [countries, setCountries]           = useState('')
  const [proxies, setProxies]               = useState('')

  const csrfHeader = () => ({
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfStore.get() ?? '',
  })

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/siri0/settings`, {
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfStore.get() ?? '' },
      })
      if (!res.ok) throw new Error('Failed to load settings')
      const s = await res.json()
      setSiteName(s.siteName || '')
      setSiteDescription(s.siteDescription || '')
      setUsdtPrice(s['USDT/DZD-Price'] || 250)
      setCountries((s.COUNTRIES || []).join(', '))
      setProxies((s.PROXIES || []).join(', '))
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { if (isActive) loadSettings() }, [isActive])

  const saveSetting = async (field) => {
    let key, value
    switch (field) {
      case 'siteName':        key = 'siteName';        value = siteName; break
      case 'siteDescription': key = 'siteDescription'; value = siteDescription; break
      case 'usdtPrice':       key = 'USDT/DZD-Price';  value = parseFloat(usdtPrice); break
      case 'countries':       key = 'COUNTRIES';        value = countries.split(',').map(s => s.trim()).filter(Boolean); break
      case 'proxies':         key = 'PROXIES';          value = proxies.split(',').map(s => s.trim()).filter(Boolean); break
      default: return
    }
    try {
      const res = await fetch(`${API_BASE}/api/siri0/settings`, {
        method: 'POST', credentials: 'include',
        headers: csrfHeader(),
        body: JSON.stringify({ [key]: value }),
      })
      const data = await res.json()
      if (data.success) showMessage('Setting saved successfully', 'success')
      else throw new Error(data.error || 'Save failed')
    } catch (err) {
      showMessage('Error saving setting: ' + err.message, 'error')
    }
  }

  return (
    <div id="settings" className={`section ${isActive ? 'active' : ''}`}>
      <div className="section-header">
        <h2>
          <i className="fas fa-sliders-h" /> Settings
          <span className="subtitle">تخصيص هوية ومنطق النظام</span>
        </h2>
      </div>

      <div className="settings-grid-layout">
        {/* Site identity */}
        <div className="settings-card shadow-soft card-glass">
          <h3 className="group-title"><i className="fas fa-id-card" /> Site Identity</h3>
          <div className="settings-form">
            <div className="form-group-modern">
              <label>Site Name</label>
              <div className="input-with-action">
                <input type="text" className="form-control" placeholder="Enter site name..." value={siteName} onChange={e => setSiteName(e.target.value)} />
                <button className="btn btn-success btn-xs" onClick={() => saveSetting('siteName')}>
                  <i className="fas fa-save" /> Save
                </button>
              </div>
            </div>
            <div className="form-group-modern">
              <label>Site Description</label>
              <div className="input-with-action">
                <textarea className="form-control" rows="2" placeholder="Short description..." value={siteDescription} onChange={e => setSiteDescription(e.target.value)} />
                <button className="btn btn-success btn-xs" onClick={() => saveSetting('siteDescription')}>
                  <i className="fas fa-save" /> Save
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Financial */}
        <div className="settings-card shadow-soft card-glass">
          <h3 className="group-title"><i className="fas fa-money-bill-wave" /> Financial Settings</h3>
          <div className="settings-form">
            <div className="form-group-modern">
              <label>USDT/DZD Price</label>
              <div className="input-with-action">
                <input type="number" className="form-control" placeholder="0.00" value={usdtPrice} onChange={e => setUsdtPrice(e.target.value)} />
                <button className="btn btn-success btn-xs" onClick={() => saveSetting('usdtPrice')}>
                  <i className="fas fa-save" /> Save
                </button>
              </div>
            </div>
            <div className="form-group-modern">
              <label>Supported Countries</label>
              <div className="input-with-action">
                <input type="text" className="form-control" placeholder="US, DZ, FR..." value={countries} onChange={e => setCountries(e.target.value)} />
                <button className="btn btn-success btn-xs" onClick={() => saveSetting('countries')}>
                  <i className="fas fa-save" /> Save
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Connection */}
        <div className="settings-card shadow-soft wide-card card-glass">
          <h3 className="group-title"><i className="fas fa-network-wired" /> Connection & Proxies</h3>
          <div className="settings-form">
            <div className="form-group-modern">
              <label>Proxy List</label>
              <div className="input-with-action">
                <textarea className="form-control" rows="3" placeholder="http://user:pass@ip:port..." value={proxies} onChange={e => setProxies(e.target.value)} />
                <button className="btn btn-success btn-xs" onClick={() => saveSetting('proxies')}>
                  <i className="fas fa-save" /> Save
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-actions-footer">
          <button className="btn btn-info btn-wide" onClick={() => { loadSettings(); showMessage('Settings synced', 'success') }}>
            <i className="fas fa-sync-alt" /> Sync All Settings
          </button>
        </div>
      </div>
    </div>
  )
}
