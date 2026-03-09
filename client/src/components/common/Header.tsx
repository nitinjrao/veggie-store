import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, ShoppingCart, Heart, Package, X, Bell } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import { useState, useEffect, useRef, useCallback } from 'react';
import { notificationService } from '../../services/notificationService';
import type { Notification } from '../../types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export default function Header({ onSearch, searchQuery = '' }: HeaderProps) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const cartCount = useCartStore((s) => s.items.length);
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchQuery);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'customer') return;
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.count);
    } catch {
      // silently fail
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  const handleOpenNotifications = async () => {
    setNotifOpen((prev) => !prev);
    if (!notifOpen) {
      setNotifLoading(true);
      try {
        const data = await notificationService.getNotifications({ limit: 10 });
        setNotifications(data.notifications || []);
      } catch {
        // silently fail
      } finally {
        setNotifLoading(false);
      }
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silently fail
      }
    }
    setNotifOpen(false);
    if (notif.orderId) {
      navigate(`/orders/${notif.orderId}`);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-200/60">
      <div className="px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <span className="text-2xl group-hover:animate-bounce-gentle transition-transform">
            🥬
          </span>
          <span className="font-heading font-bold text-xl text-gradient-green tracking-tight">Sampada Green</span>
        </Link>

        {/* Desktop Search */}
        {onSearch && (
          <div className="hidden sm:flex flex-1 max-w-lg mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/60" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search vegetables..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200/80 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green/50 focus:bg-white transition-all placeholder:text-gray-400"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          {/* Mobile search toggle */}
          {onSearch && (
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="sm:hidden p-2.5 rounded-xl hover:bg-gray-100/80 text-text-muted transition-colors"
            >
              {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
          )}

          {isAuthenticated && user?.role === 'customer' && (
            <>
              {/* Notification Bell */}
              <div ref={notifRef} className="relative">
                <button
                  onClick={handleOpenNotifications}
                  className="relative p-2.5 rounded-xl hover:bg-amber-50 text-text-muted hover:text-amber-600 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-sm animate-scale-in">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-fade-in z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-sm text-text-dark">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-3 border-primary-green border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-text-muted">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                              !notif.isRead ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {!notif.isRead && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                              )}
                              <div className={`flex-1 min-w-0 ${notif.isRead ? 'ml-4' : ''}`}>
                                <p className="text-sm font-medium text-text-dark truncate">
                                  {notif.title}
                                </p>
                                <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                                  {notif.message}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {timeAgo(notif.createdAt)}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/favorites"
                className="p-2.5 rounded-xl hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors"
              >
                <Heart className="w-5 h-5" />
              </Link>
              <Link
                to="/orders"
                className="p-2.5 rounded-xl hover:bg-blue-50 text-text-muted hover:text-blue-500 transition-colors"
              >
                <Package className="w-5 h-5" />
              </Link>
            </>
          )}

          <Link
            to="/cart"
            className="relative p-2.5 rounded-xl hover:bg-green-50 text-text-muted hover:text-primary-green transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-gradient-green text-white text-[10px] font-bold shadow-sm animate-scale-in">
                {cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-0.5 ml-1">
              <Link
                to="/profile"
                className="flex items-center gap-1.5 p-2 rounded-xl hover:bg-gray-100/80 text-text-muted hover:text-primary-green transition-colors"
                title="My Profile"
              >
                <User className="w-5 h-5" />
                <span className="text-sm hidden md:block max-w-[120px] truncate font-medium">
                  {user?.name || user?.phone || user?.email}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl hover:bg-gray-100/80 text-text-muted hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 ml-2 px-5 py-2.5 rounded-xl bg-gradient-green text-white text-sm font-semibold hover:shadow-glow-green transition-all active:scale-95"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Login</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile search bar - expandable */}
      {onSearch && mobileSearchOpen && (
        <div className="sm:hidden px-4 pb-3 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search vegetables..."
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition-all"
            />
          </div>
        </div>
      )}
    </header>
  );
}
