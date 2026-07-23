import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useClientAuth } from './ClientAuthContext.jsx';

/**
 * Protects routes that require the user to be logged in (e.g., Profile, Checkout).
 * If the user is not authenticated, redirects them to /login.
 */
export function ClientProtectedRoute() {
  const { isAuthenticated, isLoading } = useClientAuth();

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>Loading...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

/**
 * Protects routes that should only be visible to guests (e.g., Login, Register).
 * If the user is already authenticated, redirects them to the home page (/).
 */
export function ClientPublicRoute() {
  const { isAuthenticated, isLoading } = useClientAuth();

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>Loading...</div>;
  }

  return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}
