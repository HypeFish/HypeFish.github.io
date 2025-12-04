// src/components/PlaylistExplorer.tsx
import React, { useState, useMemo, useEffect } from 'react';
import '../styles/global.css';
import './PlaylistExplorer.css';

// --- Type Definitions ---
interface Artist {
  name: string;
}

interface Image {
  url: string;
}

interface Album {
  images: Image[];
}

interface ExternalUrls {
  spotify: string;
}

interface Track {
  id: string;
  name: string;
  artists: Artist[];
  album: Album;
  external_urls: ExternalUrls;
}

export interface TrackItem {
  track: Track | null;
}

interface PlaylistExplorerProps {
  items: TrackItem[];
}

const PlaylistExplorer: React.FC<PlaylistExplorerProps> = ({ items }) => {
  const safeItems = items || [];
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(12);

  // Initialize with a STABLE order to prevent hydration mismatch
  const [shuffledIndices, setShuffledIndices] = useState<number[]>(() =>
    [...Array(safeItems.length).keys()]
  );

  // Trigger shuffle only on the client side
  useEffect(() => {
    setShuffledIndices((prev) => [...prev].sort(() => 0.5 - Math.random()));
  }, []);

  // 1. Calculate Top Artists (Safely)
  const topArtists = useMemo(() => {
    const counts: Record<string, number> = {};
    
    safeItems.forEach((item) => {
      // Check if track, artists array, and first artist name exist
      if (
        !item.track || 
        !item.track.artists || 
        item.track.artists.length === 0 || 
        !item.track.artists[0].name
      ) return;

      const artist = item.track.artists[0].name;
      counts[artist] = (counts[artist] || 0) + 1;
    });

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [safeItems]);

  // 2. Handle Search Filtering
  const filteredItems = useMemo(() => {
    if (!searchTerm) {
      return shuffledIndices.map((i) => safeItems[i]);
    }

    const term = searchTerm.toLowerCase();

    return safeItems.filter((item) => {
      // Skip if track is missing
      if (!item.track) return false;

      // FIX: Use (value || '') pattern to handle nulls safely
      const trackName = (item.track.name || '').toLowerCase();
      
      // FIX: Use optional chaining (?.) and fallback to empty string
      const artistName = (item.track.artists?.[0]?.name || '').toLowerCase();

      return trackName.includes(term) || artistName.includes(term);
    });
  }, [safeItems, searchTerm, shuffledIndices]);

  const handleShuffle = () => {
    setShuffledIndices(
      [...Array(safeItems.length).keys()].sort(() => 0.5 - Math.random())
    );
    setSearchTerm('');
    setVisibleCount(12);
  };

  return (
    <div className="playlist-explorer">
      {/* --- STATS SECTION --- */}
      <div className="stats-panel">
        <h3>🔥 Your Top Artists</h3>
        <div className="top-artists">
          {topArtists.map(([name, count], index) => (
            <div key={name} className="artist-badge">
              <span className="rank">#{index + 1}</span>
              <span className="name">{name}</span>
              <span className="count">({count} songs)</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- CONTROLS --- */}
      <div className="controls">
        <input
          type="text"
          placeholder="Search for a song or artist..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
        <button onClick={handleShuffle} className="shuffle-btn">
          🎲 Shuffle View
        </button>
      </div>

      {/* --- TRACK GRID --- */}
      <div className="track-grid">
        {filteredItems.slice(0, visibleCount).map((item, idx) => {
          if (!item.track) return null;
          const track = item.track;
          
          const image =
            track.album.images && track.album.images.length > 0
              ? track.album.images[1]?.url || track.album.images[0]?.url
              : '/favicon.svg'; 

          const artistName =
            track.artists && track.artists.length > 0 && track.artists[0].name
              ? track.artists[0].name
              : 'Unknown Artist';

          return (
            <a
              key={`${track.id}-${idx}`}
              href={track.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="track-card"
            >
              <img src={image} alt={track.name} loading="lazy" />
              <div className="track-info">
                <div className="track-name">{track.name || 'Unknown Track'}</div>
                <div className="artist-name">{artistName}</div>
              </div>
            </a>
          );
        })}
      </div>

      {/* --- LOAD MORE --- */}
      {visibleCount < filteredItems.length && (
        <button
          className="load-more-btn"
          onClick={() => setVisibleCount((prev) => prev + 12)}
        >
          Load More
        </button>
      )}
    </div>
  );
};

export default PlaylistExplorer;