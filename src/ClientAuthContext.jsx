import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE } from './api.js';
import { csrfStore } from './csrfStore.js';

const ClientAuthContext = createContext();

export function ClientAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      // We hit the CSRF endpoint to check authentication and get the CSRF token
      // This serves as the primary auth check for the frontend
      const res = await fetch(`${API_BASE}/api/auth/csrf`, {
        method: 'GET', // or POST depending on backend implementation
        credentials: 'include',
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (res.ok && data.csrfToken) {
        setIsAuthenticated(true);
        csrfStore.set(data.csrfToken);
      } else {
        setIsAuthenticated(false);
        csrfStore.clear();
      }
    } catch (err) {
      setIsAuthenticated(false);
      csrfStore.clear();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfStore.get() || '' 
        },
      });
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setIsAuthenticated(false);
      csrfStore.clear();
    }
  }, []);

  return (
    <ClientAuthContext.Provider value={{ isAuthenticated, isLoading, checkAuth, logout, setIsAuthenticated }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  return useContext(ClientAuthContext);
}
