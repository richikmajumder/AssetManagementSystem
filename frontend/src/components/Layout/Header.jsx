import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../lib/api';
import { Button } from '../ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '../ui/dropdown-menu';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Bell, Menu, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const Header = ({ onMenuClick }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll();
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'service_request':
      case 'service_request_update':
        return '🔧';
      case 'asset_assigned':
        return '📦';
      case 'consumable_order':
      case 'consumable_update':
        return '🛒';
      case 'account_status':
        return '👤';
      default:
        return '🔔';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={onMenuClick}
            data-testid="menu-toggle-btn"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Welcome, {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-xs text-slate-500">
              {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                data-testid="notifications-btn"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-4 py-2">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto py-1 px-2 text-xs"
                    onClick={handleMarkAllRead}
                    disabled={isLoading}
                    data-testid="mark-all-read-btn"
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[300px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <Bell className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 20).map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id}
                      className="flex items-start gap-3 p-3 cursor-pointer"
                      onClick={() => !notification.is_read && handleMarkRead(notification.id)}
                      data-testid={`notification-${notification.id}`}
                    >
                      <span className="text-lg">{getNotificationIcon(notification.notification_type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${notification.is_read ? 'text-slate-500' : 'text-slate-900 font-medium'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          <Badge 
            variant="outline" 
            className="hidden sm:flex capitalize"
            data-testid="user-role-badge"
          >
            {user?.role?.replace('_', ' ')}
          </Badge>
        </div>
      </div>
    </header>
  );
};

export default Header;
