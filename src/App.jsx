import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import './App.css'

import { ClientAuthProvider } from './ClientAuthContext.jsx'
import { ClientProtectedRoute, ClientPublicRoute } from './ClientRoutes.jsx'

import LandingPage from './CompJSX/Landing.jsx'
import GamesPage from './CompJSX/Games.jsx'
import CartPage from './CompJSX/Cart.jsx'
import DetailsPage from './CompJSX/Details.jsx'
import NotFound from './NotFound.jsx'
import AdminLogin from './CompJSX/AdminLogin.jsx'
import AdminDashboard from './AdminPanel/AdminDashboard.jsx'
import ClientAuth from './CompJSX/ClientAuth.jsx'
import Profile from './CompJSX/Profile.jsx'

function App() {
  return (
    <ClientAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          
          {/* Public routes only (redirects to home if logged in) */}
          <Route element={<ClientPublicRoute />}>
            <Route path="/login" element={<ClientAuth />} />
          </Route>

          {/* Protected routes (redirects to login if not logged in) */}
          <Route element={<ClientProtectedRoute />}>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="/games" >
            <Route index element={<GamesPage />} />
            <Route path=":appId" element={<DetailsPage />} />
            <Route path="buy" element={<GamesPage />} />
          </Route>

          <Route path="/admin/login"     element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </ClientAuthProvider>
  )
}

export default App
