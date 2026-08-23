import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/70 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-200/40 blur-3xl mix-blend-multiply opacity-60"></div>
        <div className="absolute top-40 -left-40 w-96 h-96 rounded-full bg-indigo-200/40 blur-3xl mix-blend-multiply opacity-60"></div>
        <div className="absolute -bottom-40 left-20 w-96 h-96 rounded-full bg-emerald-100/40 blur-3xl mix-blend-multiply opacity-60"></div>
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 z-10 relative backdrop-blur-xl">
        <div className="flex flex-col items-center mb-6 text-center">
          {/* Official KEC Logo */}
          <div className="w-full max-w-[240px] mb-3 bg-white p-2 rounded-2xl flex items-center justify-center">
            <img
              src="/kec-logo.png"
              alt="Kongu Engineering College"
              className="w-full h-auto max-h-16 object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-[11px] font-bold tracking-wide uppercase text-blue-700">
              SmartAttend Portal
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {title || 'Kongu Engineering College'}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
              {subtitle}
            </p>
          )}
        </div>
        {children ? children : <Outlet />}
      </div>
    </div>
  );
};

export default AuthLayout;
