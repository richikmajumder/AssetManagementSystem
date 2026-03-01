import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { Toaster } from '../ui/sonner';
import { Loader2 } from 'lucide-react';

const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="md:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
};

export default DashboardLayout;
