import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, ShoppingCart, Heart, Package, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useCartStore } from '../../stores/cartStore';
import { useState } from 'react';

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

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-100/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <span className="text-2xl group-hover:animate-bounce-gentle transition-transform">🥬</span>
          <span className="font-heading font-bold text-xl text-gradient-green">
            Sampada Green
          </span>
        </Link>

        {/* Desktop Search */}
        {onSearch && (
          <div className="hidden sm:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search vegetables..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition-all placeholder:text-gray-400"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
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
            <div className="flex items-center gap-1 ml-1">
              <Link
                to="/profile"
                className="flex items-center gap-1.5 p-2 rounded-xl hover:bg-gray-100/80 text-text-muted hover:text-primary-green transition-colors"
                title="My Profile"
              >
                <User className="w-5 h-5" />
                <span className="text-sm hidden md:block max-w-[120px] truncate">
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
              className="flex items-center gap-1.5 ml-1 px-4 py-2 rounded-xl bg-gradient-green text-white text-sm font-medium hover:shadow-glow-green transition-all active:scale-95"
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
