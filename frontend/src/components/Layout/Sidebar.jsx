import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  ShoppingCart, 
  History,
  LogOut,
  X,
  ChevronRight,
  User
} from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '../../lib/utils';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_equipment-tracker-59/artifacts/hrjwe66k_Logo.png";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin, isAdminOrCoAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      title: 'My Assets',
      href: '/my-assets',
      icon: Package,
      show: !isAdminOrCoAdmin,
    },
    {
      title: 'All Assets',
      href: '/assets',
      icon: Package,
      show: isAdminOrCoAdmin,
    },
    {
      title: 'Users',
      href: '/users',
      icon: Users,
      show: isAdminOrCoAdmin,
    },
    {
      title: 'Service Requests',
      href: '/service-requests',
      icon: FileText,
      show: true,
    },
    {
      title: 'Consumables',
      href: '/consumables',
      icon: ShoppingCart,
      show: true,
    },
    {
      title: 'Activity Logs',
      href: '/logs',
      icon: History,
      show: isAdmin,
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-full w-72 md:w-64 bg-slate-900 border-r border-slate-800 z-40",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="IDEAL Lab" className="w-10 h-10 object-contain" />
              <div>
                <h2 
                  className="font-bold"
                  style={{ 
                    background: 'linear-gradient(135deg, #DAA520 0%, #FFD700 50%, #DAA520 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  IDEAL Lab
                </h2>
                <p className="text-xs text-slate-500">Inventory System</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-slate-400 hover:text-white"
              onClick={onClose}
              data-testid="sidebar-close-btn"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {navItems.filter(item => item.show).map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                    isActive 
                      ? "bg-amber-500/10 text-amber-500" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                  data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                  <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100" />
                </NavLink>
              ))}
            </nav>
          </ScrollArea>

          <Separator className="bg-slate-800" />

          {/* User section */}
          <div className="p-4">
            <NavLink
              to="/profile"
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex items-center gap-3 mb-4 p-2 rounded-lg transition-colors",
                isActive ? "bg-slate-800" : "hover:bg-slate-800"
              )}
              data-testid="nav-profile"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.profile_photo} alt={user?.name} />
                <AvatarFallback className="bg-slate-700 text-slate-300">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.role === 'admin' ? 'Administrator' : 
                   user?.role === 'co_admin' ? 'Co-Admin' : 'User'}
                </p>
              </div>
            </NavLink>
            
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-800 hover:bg-red-900/20"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
