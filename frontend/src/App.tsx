import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExplorePage } from './pages/ExplorePage';
import { RoutePage } from './pages/RoutePage';
import { BreaksPage } from './pages/BreaksPage';
import { SupportPage } from './pages/SupportPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { RakshitArthaPage } from './pages/RakshitArthaPage';
import { SignupPage } from './pages/SignupPage';
import { LoginPage } from './pages/LoginPage';

const VALID_TABS = [
  'landing', 'dashboard', 'explore', 'route', 
  'breaks', 'rakshitartha', 'support', 'profile', 
  'admin', 'signup', 'login'
];

function getInitialTab(): string {
  if (typeof window === 'undefined') return 'landing';
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  const path = window.location.pathname.replace(/^\//, '').toLowerCase();
  const candidate = hash || path;
  if (candidate && VALID_TABS.includes(candidate)) {
    return candidate;
  }
  return 'landing';
}

export function AppContent() {
  const [activeTab, setActiveTab] = useState<string>(getInitialTab);
  const { isRestoringSession } = useAuth();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Sync hash changes from browser history (back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (hash && VALID_TABS.includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingPage onNavigate={handleTabChange} />;
      case 'dashboard':
        return <DashboardPage onNavigate={handleTabChange} />;
      case 'explore':
        return <ExplorePage />;
      case 'route':
        return <RoutePage />;
      case 'breaks':
        return <BreaksPage onNavigate={handleTabChange} />;
      case 'rakshitartha':
        return <RakshitArthaPage onNavigate={handleTabChange} />;
      case 'support':
        return <SupportPage />;
      case 'profile':
        return <ProfilePage />;
      case 'admin':
        return <AdminPage />;
      case 'signup':
        return <SignupPage onNavigate={handleTabChange} />;
      case 'login':
        return <LoginPage onNavigate={handleTabChange} />;
      default:
        return <LandingPage onNavigate={handleTabChange} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />

      {/* Subtle indicator while session is being verified on startup */}
      {isRestoringSession && (
        <div style={{
          backgroundColor: '#F0FDFA',
          borderBottom: '1px solid #CCFBF1',
          padding: '6px 12px',
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--primary-dark)',
          fontWeight: 600
        }}>
          Restoring secure Restora session...
        </div>
      )}

      <main style={{ flex: 1 }}>
        {renderActivePage()}
      </main>
      <Footer setActiveTab={handleTabChange} />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
