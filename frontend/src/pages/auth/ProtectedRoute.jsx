import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '@/components/ui/LoadingState';

export const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState fullScreen message="Verifying session..." />;
  }

  const token = localStorage.getItem('token');
  
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const currentUserRole = (user?.role || location.pathname.split('/')[1] || '').toUpperCase();

  if (allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map(r => String(r).toUpperCase());
    if (!normalizedAllowed.includes(currentUserRole)) {
      return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
          <h1 className="mb-2 text-5xl font-extrabold text-slate-900 tracking-tight">403</h1>
          <h2 className="mb-2 text-xl font-semibold text-slate-800">Access Denied</h2>
          <p className="mb-6 text-sm text-slate-500 max-w-md">
            Your role (<span className="font-semibold text-slate-700">{currentUserRole || 'UNKNOWN'}</span>) is not authorized to access this resource.
          </p>
          <button
            onClick={() => window.history.back()}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>
      );
    }
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
