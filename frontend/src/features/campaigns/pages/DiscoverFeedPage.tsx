import React, { useState } from 'react';
import './DiscoverFeedPage.css';

const DiscoverFeedPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [
    'All',
    'Education',
    'Fitness & Gym',
    'Gaming',
    'Travel',
    'Food & Restaurant',
    'Technology'
  ];

  return (
    <div className="discover-page">
      {/* TopAppBar */}
      <header className="discover-top-bar">
        <div className="discover-title-wrap">
          <span className="material-symbols-outlined discover-search-icon" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
          <h1 className="discover-brand">Discover</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="discover-main">
        {/* Search & Filter Bar */}
        <div className="search-filter-wrap">
          <div className="search-input-wrap">
            <span className="material-symbols-outlined search-input-icon">search</span>
            <input 
              className="discover-search-input" 
              placeholder="Search by name, category..." 
              type="text" 
            />
          </div>
          <button className="discover-filter-btn">
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>

        {/* Horizontal Chips */}
        <div className="chips-scroll-area hide-scrollbar">
          {categories.map(cat => (
            <button 
              key={cat}
              className={`discover-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Creator Cards List */}
        <div className="creator-list">
          {/* Card 1 */}
          <div className="discover-glass-card">
            <div className="creator-header">
              <img 
                alt="Jikki Thakur" 
                className="creator-avatar" 
                src="https://lh3.googleusercontent.com/aida/AP1WRLsAciJvVI6nGE8Riv5pl5AiCdsgUyuCBIztyf8yJ1nMsVzN_tKamimn4oVc377SuO03Y0BLG3vBSg6L9Gb661VbZxjTCOmgqtLkycpkas-Y4kNRelTvegSPmDOwuXDoRbG_T9NDOpD85w4fS1MEQXqfzIMok67ViFzp1sO1_5M7JgPmQnt8hPSXXoZIoKnrd1CqosMcNxDB8nQ1sCkiHfR8QRnCR7F_sliBrGJirtLIostx8BD9Qdq5Oh0"
              />
              <div className="creator-info">
                <div className="creator-name-row">
                  <h3 className="creator-name">Jikki Thakur</h3>
                  <span className="material-symbols-outlined creator-verified" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <p className="creator-handle">@jikkithakur</p>
                <div className="creator-location">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                  <span>New Delhi, India</span>
                </div>
              </div>
            </div>
            
            <p className="creator-bio">Tech professional & passionate world traveler.</p>
            
            <div className="creator-stats-grid">
              <div className="creator-stat-box">
                <div className="stat-value">1.2M</div>
                <div className="stat-label">Followers</div>
              </div>
              <div className="creator-stat-box bordered">
                <div className="stat-value">50+</div>
                <div className="stat-label">Campaigns</div>
              </div>
              <div className="creator-stat-box">
                <div className="stat-value gold">₹12.0K</div>
                <div className="stat-label gold">Per Post</div>
              </div>
            </div>
            
            <div className="creator-footer">
              <div className="creator-platforms">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>play_circle</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>photo_camera</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>music_note</span>
              </div>
              <button className="liquid-btn">
                View Media Kit
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="discover-glass-card">
            <div className="creator-header">
              <div className="creator-avatar-placeholder">MT</div>
              <div className="creator-info">
                <div className="creator-name-row">
                  <h3 className="creator-name">Meera Travels</h3>
                  <span className="material-symbols-outlined creator-verified" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <p className="creator-handle">@meeratravels</p>
                <div className="creator-location">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                  <span>Mumbai, India</span>
                </div>
              </div>
            </div>
            
            <p className="creator-bio">Travel vlogger | Exploring the world one city at a time.</p>
            
            <div className="creator-stats-grid">
              <div className="creator-stat-box">
                <div className="stat-value">820K</div>
                <div className="stat-label">Followers</div>
              </div>
              <div className="creator-stat-box bordered">
                <div className="stat-value">35+</div>
                <div className="stat-label">Campaigns</div>
              </div>
              <div className="creator-stat-box">
                <div className="stat-value gold">₹8.5K</div>
                <div className="stat-label gold">Per Post</div>
              </div>
            </div>
            
            <div className="creator-footer">
              <div className="creator-platforms">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>photo_camera</span>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>play_circle</span>
              </div>
              <button className="liquid-btn">
                View Media Kit
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DiscoverFeedPage;
