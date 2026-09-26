import React from 'react';
import { Compass, MapPin, Plus, Coffee, User } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAddSpot: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddSpot,
}) => {
  return (
    <nav className="mobile-bottom-nav">
      {/* 1. HOME */}
      <button
        type="button"
        className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setActiveTab('dashboard')}
        aria-label="Home Dashboard"
      >
        <Compass size={20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 1.8} />
        <span>HOME</span>
      </button>

      {/* 2. EXPLORE */}
      <button
        type="button"
        className={`mobile-nav-item ${activeTab === 'explore' ? 'active' : ''}`}
        onClick={() => setActiveTab('explore')}
        aria-label="Explore Map"
      >
        <MapPin size={20} strokeWidth={activeTab === 'explore' ? 2.5 : 1.8} />
        <span>EXPLORE</span>
      </button>

      {/* 3. ADD SPOT (Prominent Central Action Button) */}
      <button
        type="button"
        className="mobile-nav-item-add"
        onClick={onOpenAddSpot}
        aria-label="Add New Spot (+15 pts)"
      >
        <div className="mobile-add-btn">
          <Plus size={22} strokeWidth={3} />
        </div>
        <span className="mobile-add-label">ADD</span>
      </button>

      {/* 4. ACTIVITY / BREAKS */}
      <button
        type="button"
        className={`mobile-nav-item ${activeTab === 'breaks' ? 'active' : ''}`}
        onClick={() => setActiveTab('breaks')}
        aria-label="Breaks and Activity"
      >
        <Coffee size={20} strokeWidth={activeTab === 'breaks' ? 2.5 : 1.8} />
        <span>ACTIVITY</span>
      </button>

      {/* 5. PROFILE */}
      <button
        type="button"
        className={`mobile-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveTab('profile')}
        aria-label="Rider Profile"
      >
        <User size={20} strokeWidth={activeTab === 'profile' ? 2.5 : 1.8} />
        <span>PROFILE</span>
      </button>
    </nav>
  );
};
