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
  Settings,
  LogOut,
  FlaskConical,
  X,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { cn } from '../../lib/utils';

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
          "fixed left-0 top-0 h-full w-72 md:w-64 bg-white border-r border-slate-200 z-40",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        data-testid="sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">IDEAL Lab</h2>
                <p className="text-xs text-slate-500">Inventory System</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
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
                      ? "bg-blue-50 text-blue-700" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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

          <Separator />

          {/* User section */}
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                <span className="text-sm font-bold text-slate-600">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.role === 'admin' ? 'Administrator' : 
                   user?.role === 'co_admin' ? 'Co-Admin' : 'User'}
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2 text-slate-600 hover:text-red-600 hover:border-red-200"
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
