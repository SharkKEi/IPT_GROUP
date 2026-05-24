import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ensureCsrfCookie } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ProtectedLayout() {
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      ensureCsrfCookie();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
