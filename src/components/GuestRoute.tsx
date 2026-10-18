import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AppContext';
import { Spinner } from './UI';

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, authBusy } = useAuth();
  if (loading) return <div role="status" aria-label="Restoring your session" className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]"><Spinner size="lg" /></div>;
  // Keep an active form mounted so authentication failures can show their errors.
  if (user && !authBusy) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
