import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../lib/auth";
import { LogOut, User, Menu, X } from "lucide-react";
import { useState } from "react";
import Logo from "./Logo";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Logo showTagline={false} size="sm" />

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`btn-ghost text-sm ${isActive("/dashboard") ? "text-primary bg-primary/5" : ""}`}
                  aria-current={isActive("/dashboard") ? "page" : undefined}
                >
                  My Trips
                </Link>
                <Link
                  to="/"
                  className={`btn-ghost text-sm ${isActive("/") ? "text-primary bg-primary/5" : ""}`}
                  aria-current={isActive("/") ? "page" : undefined}
                >
                  Plan a Trip
                </Link>
                <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="max-w-[140px] truncate">{user.email}</span>
                  </div>
                  <button onClick={handleSignOut} className="btn-ghost text-sm text-gray-500 hover:text-destructive">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`btn-ghost text-sm ${isActive("/login") ? "text-primary bg-primary/5" : ""}`}
                  aria-current={isActive("/login") ? "page" : undefined}
                >
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary text-sm py-2 px-5">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white/95 backdrop-blur-lg">
          <div className="px-4 py-4 space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                  <User className="w-4 h-4" />
                  <span className="truncate">{user.email}</span>
                </div>
                <Link to="/dashboard" className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors" onClick={() => setMobileOpen(false)}>
                  My Trips
                </Link>
                <Link to="/" className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors" onClick={() => setMobileOpen(false)}>
                  Plan a Trip
                </Link>
                <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-destructive font-medium transition-colors cursor-pointer">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link to="/signup" className="block px-3 py-2 rounded-lg bg-accent text-white text-sm font-medium text-center transition-colors" onClick={() => setMobileOpen(false)}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}