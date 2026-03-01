import React from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "./components/ui/sonner";

// Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Users from "./pages/Users";
import ServiceRequests from "./pages/ServiceRequests";
import Consumables from "./pages/Consumables";
import MyAssets from "./pages/MyAssets";
import ActivityLogs from "./pages/ActivityLogs";
import Profile from "./pages/Profile";

// Layout
import DashboardLayout from "./components/Layout/DashboardLayout";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
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
              <Route path="/profile" element={<Profile />} />
            </Route>
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
