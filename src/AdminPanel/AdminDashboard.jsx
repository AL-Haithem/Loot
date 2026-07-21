// AdminDashboard — main shell for the admin panel
// • On mount: if csrfStore is empty → fetch /api/vv/adm/csrf to revalidate session
//             If that fails (401/403/network) → redirect to /admin/login
// • Renders the full admin UI (Sidebar + sections) using the Temp design
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'

import { API_BASE }  from '../api.js'
import { csrfStore } from '../csrfStore.js'

import { ToastProvider } from './Toast.jsx'
import Sidebar      from './Sidebar.jsx'
import Dashboard    from './Dashboard.jsx'
import Crawler      from './Crawler.jsx'
import Settings     from './Settings.jsx'
import DataManager  from './DataManager.jsx'
import Logs         from './Logs.jsx'

// Admin panel CSS (copied from Temp)
import '../CompCss/admin.css'

// ─── Auth guard ───────────────────────────────────────────────────────────────
async function revalidateSession() {
  // The backend /api/auth/csrf endpoint:
  // - Requires a valid JWT cookie (Protection middleware)
  // - Returns { csrfToken } on success, or 401/403 on failure
  const res = await fetch(`${API_BASE}/api/auth/csrf`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Not authenticated')
  const data = await res.json()
  return data.csrfToken ?? null
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [authChecked, setAuthChecked] = useState(false) // false = still checking
  const [activeSection, setActiveSection] = useState('dashboard')

  // ── Session guard on mount ──────────────────────────────────────────────────
  useEffect(() => {
    // If CSRF token is already in memory (same tab, logged in), skip the network check
    if (csrfStore.isSet()) {
      setAuthChecked(true)
      return
    }

    // Token missing (page reload) → ask the server
    revalidateSession()
      .then((token) => {
        if (token) csrfStore.set(token)
        setAuthChecked(true)
      })
      .catch(() => {
        // Not authenticated → send to login
        csrfStore.clear()
        navigate('/admin/login', { replace: true })
      })
  }, [navigate])

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfStore.get() ?? '',
        },
      })
    } catch {
      // Ignore network errors — clear state and redirect regardless
    } finally {
      csrfStore.clear()
      navigate('/admin/login', { replace: true })
    }
  }

  // ── Loading state (checking auth) ───────────────────────────────────────────
  if (!authChecked) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--body-bg, #030712)',
          color: '#94a3b8',
          fontFamily: 'Inter, sans-serif',
          gap: '12px',
          fontSize: '0.9rem',
        }}
      >
        <span
          style={{
            width: '18px', height: '18px',
            border: '2px solid rgba(0,242,254,0.2)',
            borderTop: '2px solid #00f2fe',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            display: 'inline-block',
          }}
        />
        Verifying session...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Admin Panel UI ──────────────────────────────────────────────────────────
  return (
    <ToastProvider>
      <div id="adminApp">
        <div className="bg-glow" />

        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
        />

        <div className="main-content">
          <Dashboard    isActive={activeSection === 'dashboard'} />
          <Crawler      isActive={activeSection === 'crawler'}   />
          <Settings     isActive={activeSection === 'settings'}  />
          <DataManager  isActive={activeSection === 'data'}      />
          <Logs         isActive={activeSection === 'logs'}      />
        </div>
      </div>
    </ToastProvider>
  )
}
