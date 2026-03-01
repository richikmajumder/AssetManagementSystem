import React from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Users from "./pages/Users";
import ServiceRequests from "./pages/ServiceRequests";
import Consumables from "./pages/Consumables";
import MyAssets from "./pages/MyAssets";
import ActivityLogs from "./pages/ActivityLogs";

// Layout
import DashboardLayout from "./components/Layout/DashboardLayout";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/users" element={<Users />} />
            <Route path="/service-requests" element={<ServiceRequests />} />
            <Route path="/consumables" element={<Consumables />} />
            <Route path="/my-assets" element={<MyAssets />} />
            <Route path="/logs" element={<ActivityLogs />} />
          </Route>
          
          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}

export default App;
