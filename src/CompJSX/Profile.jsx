import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useClientAuth } from '../ClientAuthContext.jsx';

export default function Profile() {
  const { logout } = useClientAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div style={{ padding: '40px', color: '#fff', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>User Profile</h1>
      <p style={{ marginBottom: '20px' }}>Welcome to your protected profile page! You can only see this if you are logged in.</p>
      
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <Link to="/" style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', textDecoration: 'none', borderRadius: '5px' }}>
          Back to Store
        </Link>
        <button 
          onClick={handleLogout}
          style={{ padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
