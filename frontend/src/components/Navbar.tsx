import React, { useState } from 'react';
import { 
  Compass, MapPin, Coffee, Route, 
  HelpCircle, Shield, User as UserIcon, 
  LogOut, LogIn, Menu, X, CheckCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, isAuthenticated, isAdmin, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="container nav-container">
        {/* Brand Logo */}
        <a 
          href="#home" 
          className="nav-brand"
          onClick={(e) => { e.preventDefault(); handleNavClick('landing'); }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <Coffee size={20} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              Restora
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Rest-Point Network
            </div>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="nav-links">
          <button 
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <Compass size={16} />
            Dashboard
          </button>

          <button 
            className={`nav-link ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => handleNavClick('explore')}
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <MapPin size={16} />
            Explore Map
          </button>

          <button 
            className={`nav-link ${activeTab === 'route' ? 'active' : ''}`}
            onClick={() => handleNavClick('route')}
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <Route size={16} />
            Route Planning
          </button>

          <button 
            className={`nav-link ${activeTab === 'breaks' ? 'active' : ''}`}
            onClick={() => handleNavClick('breaks')}
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <Coffee size={16} />
            Breaks & Income
          </button>

          <button 
            className={`nav-link ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => handleNavClick('support')}
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <HelpCircle size={16} />
            Support
          </button>

          {isAdmin && (
            <button 
              className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => handleNavClick('admin')}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--accent)' }}
            >
              <Shield size={16} />
              Admin
            </button>
          )}
        </nav>

        {/* User Auth Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button 
                onClick={() => handleNavClick('profile')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 12px' }}
              >
                <UserIcon size={14} color="var(--primary)" />
                <span>{user.name}</span>
                <span className="badge badge-verified" style={{ fontSize: 9 }}>
                  {user.role === 'admin' ? 'Admin' : 'Rider'}
                </span>
              </button>

              <button 
                onClick={logout}
                className="btn btn-secondary btn-sm"
                title="Log Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => openAuthModal('login')}
              className="btn btn-primary btn-sm"
            >
              <LogIn size={14} />
              Worker Sign In
            </button>
          )}

          {/* Mobile hamburger button */}
          <button 
            className="btn btn-secondary btn-sm mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: 'none' }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <button 
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <Compass size={16} /> Dashboard
          </button>
          <button 
            className={`nav-link ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => handleNavClick('explore')}
          >
            <MapPin size={16} /> Explore Map
          </button>
          <button 
            className={`nav-link ${activeTab === 'route' ? 'active' : ''}`}
            onClick={() => handleNavClick('route')}
          >
            <Route size={16} /> Route Planning
          </button>
          <button 
            className={`nav-link ${activeTab === 'breaks' ? 'active' : ''}`}
            onClick={() => handleNavClick('breaks')}
          >
            <Coffee size={16} /> Breaks & Income
          </button>
          <button 
            className={`nav-link ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => handleNavClick('support')}
          >
            <HelpCircle size={16} /> Support Resources
          </button>
          {isAdmin && (
            <button 
              className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => handleNavClick('admin')}
            >
              <Shield size={16} /> Admin Management
            </button>
          )}
        </div>
      )}
    </header>
  );
};
