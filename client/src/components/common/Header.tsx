import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, ShoppingCart } from 'lucide-react';
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

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🥬</span>
          <span className="font-heading font-bold text-xl text-primary-green">
            Veggie Store
          </span>
        </Link>

        {onSearch && (
          <div className="hidden sm:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search vegetables..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Link to="/cart" className="relative p-2 rounded-full hover:bg-gray-100 text-text-muted">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-primary-green text-white text-xs font-bold">
                {cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <>
              <span className="text-sm text-text-muted hidden sm:block">
                {user?.name || user?.phone || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-gray-100 text-text-muted"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 px-4 py-2 rounded-full bg-primary-green text-white text-sm font-medium hover:bg-primary-green-dark transition"
            >
              <User className="w-4 h-4" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
