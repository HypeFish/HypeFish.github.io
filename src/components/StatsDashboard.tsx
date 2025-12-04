import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import '../styles/global.css';

interface StatsDashboardProps {
  tracks: any[];
}

// 1. Helper Component for the "Hall of Fame" Cards
const StatCard = ({ label, track, color, metric }: any) => (
  <div style={{ 
    background: '#fff', 
    padding: '1.5rem', 
    borderRadius: '12px', 
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    textAlign: 'center',
    borderTop: `4px solid ${color}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%'
  }}>
    <h4 style={{ margin: '0 0 1rem 0', color: '#555', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>{label}</h4>
    {track ? (
      <>
        <img 
            src={track.album.images[0]?.url} 
            alt={track.name} 
            style={{ width: '80px', height: '80px', borderRadius: '4px', marginBottom: '1rem', objectFit: 'cover' }} 
        />
        <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{track.name}</div>
        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>{track.artists[0].name}</div>
        <div style={{ 
            display: 'inline-block', 
            padding: '0.25rem 0.5rem', 
            background: '#f4f4f4', 
            borderRadius: '4px', 
            fontSize: '0.8rem',
            fontWeight: 'bold',
            color: '#333',
            marginTop: 'auto'
        }}>
            {metric}
        </div>
      </>
    ) : <p>N/A</p>}
  </div>
);

// 2. Custom Tooltip for the Scatter Plot
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: '#2b2b2b', color: '#fff', padding: '10px', borderRadius: '5px', border: '1px solid #444' }}>
        <p style={{ fontWeight: 'bold', margin: 0 }}>{data.name}</p>
        <p style={{ fontSize: '0.8rem', margin: 0, opacity: 0.8 }}>{data.artist}</p>
        <p style={{ fontSize: '0.7rem', margin: '5px 0 0 0', color: '#aaa' }}>
          Mood: {Math.round(data.valence * 100)}% Happy / {Math.round(data.energy * 100)}% Energetic
        </p>
      </div>
    );
  }
  return null;
};

const StatsDashboard: React.FC<StatsDashboardProps> = ({ tracks }) => {
  
  // --- DATA 1: DECADES (Bar Chart) ---
  const decadeData = useMemo(() => {
    const decades: Record<string, number> = {};
    tracks.forEach((item) => {
      const releaseDate = item.track?.album?.release_date;
      if (!releaseDate) return;
      const year = parseInt(releaseDate.split('-')[0]);
      if (isNaN(year)) return;
      
      const decade = `${Math.floor(year / 10) * 10}s`;
      decades[decade] = (decades[decade] || 0) + 1;
    });

    return Object.entries(decades)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tracks]);

  // --- DATA 2: POPULARITY (Bar Chart) ---
  const popularityData = useMemo(() => {
    const buckets = Array(10).fill(0);
    tracks.forEach((item) => {
      const pop = item.track?.popularity || 0;
      const bucketIndex = Math.min(Math.floor(pop / 10), 9);
      buckets[bucketIndex]++;
    });

    return buckets.map((count, i) => ({
      name: `${i * 10}-${i * 10 + 10}`,
      count,
    }));
  }, [tracks]);

  // --- DATA 3: EXTREMES (Cards) ---
  const extremes = useMemo(() => {
    if (tracks.length === 0) return null;
    
    // Sort by popularity
    const sortedByPop = [...tracks].sort((a, b) => 
      (a.track?.popularity || 0) - (b.track?.popularity || 0)
    );

    // Sort by Date
    const sortedByDate = [...tracks].sort((a, b) => {
      const dateA = new Date(a.track?.album?.release_date || 0).getTime();
      const dateB = new Date(b.track?.album?.release_date || 0).getTime();
      return dateA - dateB;
    });

    return {
      mostObscure: sortedByPop[0]?.track,
      mostPopular: sortedByPop[sortedByPop.length - 1]?.track,
      oldest: sortedByDate[0]?.track,
      newest: sortedByDate[sortedByDate.length - 1]?.track,
    };
  }, [tracks]);

  // --- DATA 4: AUDIO RADAR ---
  const radarData = useMemo(() => {
    let acc = { danceability: 0, energy: 0, speechiness: 0, acousticness: 0, valence: 0 };
    let count = 0;

    tracks.forEach(t => {
      if (t.audio) {
        acc.danceability += t.audio.danceability;
        acc.energy += t.audio.energy;
        acc.speechiness += t.audio.speechiness;
        acc.acousticness += t.audio.acousticness;
        acc.valence += t.audio.valence;
        count++;
      }
    });

    if (count === 0) return [];

    return [
      { subject: 'Dance', A: (acc.danceability / count).toFixed(2), fullMark: 1 },
      { subject: 'Energy', A: (acc.energy / count).toFixed(2), fullMark: 1 },
      { subject: 'Speech', A: (acc.speechiness / count).toFixed(2), fullMark: 1 },
      { subject: 'Acoustic', A: (acc.acousticness / count).toFixed(2), fullMark: 1 },
      { subject: 'Happy', A: (acc.valence / count).toFixed(2), fullMark: 1 },
    ];
  }, [tracks]);

  // --- DATA 5: MOOD SCATTER ---
  const scatterData = useMemo(() => {
    return tracks
      .filter(t => t.audio)
      .map(t => ({
        x: t.audio.valence,
        y: t.audio.energy,
        name: t.track.name,
        artist: t.track.artists[0].name,
      }));
  }, [tracks]);

  // --- DATA 6: UNDERGROUND SCORE ---
  const undergroundScore = useMemo(() => {
    const obscure = tracks.filter(t => (t.track?.popularity || 0) < 20).length;
    return Math.round((obscure / tracks.length) * 100);
  }, [tracks]);

  if (!tracks.length) return <p>No data available.</p>;

  return (
    <div className="stats-dashboard" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* --- SECTION 1: TIMELINE (Bar Chart) --- */}
      <div className="chart-section" style={{ marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>⏳ Musical Time Travel</h2>
        <div style={{ height: '300px', width: '100%', minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={decadeData}>
              <XAxis dataKey="name" stroke="#8884d8" />
              <YAxis />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#333', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="count" fill="#007acc" radius={[4, 4, 0, 0]}>
                {decadeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#007acc' : '#005f99'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- SECTION 2: POPULARITY (Bar Chart) --- */}
      <div className="chart-section" style={{ marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>🌊 The Mainstream Meter</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '1rem' }}>(0 = Obscure, 100 = Top 40)</p>
        <div style={{ height: '300px', width: '100%', minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={popularityData}>
              <XAxis dataKey="name" stroke="#82ca9d" />
              <YAxis />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#333', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- SECTION 3: AUDIO FEATURES (Radar & Scatter) --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
        
        {/* Sonic Fingerprint */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>🕸️ Sonic Fingerprint</h2>
          <div style={{ height: '350px', width: '100%', minHeight: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e0e0e0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                <Radar name="My Library" dataKey="A" stroke="#8884d8" strokeWidth={3} fill="#8884d8" fillOpacity={0.4} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mood Map */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>🌌 Mood Map</h2>
          <div style={{ height: '350px', width: '100%', minHeight: '350px', background: '#f9f9f9', borderRadius: '12px', padding: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <XAxis type="number" dataKey="x" name="Happiness" domain={[0, 1]} tick={false} label={{ value: 'Sad → Happy', position: 'bottom', offset: 0 }} />
                <YAxis type="number" dataKey="y" name="Energy" domain={[0, 1]} tick={false} label={{ value: 'Chill → Intense', angle: -90, position: 'insideLeft' }} />
                <ZAxis type="number" range={[20, 20]} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter name="Songs" data={scatterData} fill="#007acc" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- SECTION 4: HALL OF FAME (Cards) --- */}
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>🏆 Collection Superlatives</h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1.5rem',
        marginBottom: '4rem'
      }}>
        <StatCard label="Most Obscure" track={extremes?.mostObscure} color="#e74c3c" metric={`Pop: ${extremes?.mostObscure?.popularity}/100`} />
        <StatCard label="Most Mainstream" track={extremes?.mostPopular} color="#2ecc71" metric={`Pop: ${extremes?.mostPopular?.popularity}/100`} />
        <StatCard label="Oldest Track" track={extremes?.oldest} color="#f1c40f" metric={extremes?.oldest?.album.release_date} />
        <StatCard label="Newest Track" track={extremes?.newest} color="#9b59b6" metric={extremes?.newest?.album.release_date} />
      </div>

      {/* --- SECTION 5: UNDERGROUND BADGE --- */}
      <div style={{ background: '#1a1a1a', color: 'white', padding: '2rem', borderRadius: '16px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7 }}>Underground Index</h3>
        <div style={{ fontSize: '4rem', fontWeight: 'bold', margin: '1rem 0', color: '#f1c40f' }}>{undergroundScore}%</div>
        <p style={{ maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
          Percent of my collection that Spotify classifies as "Obscure" (Popularity &lt; 20).
          {undergroundScore > 50 ? " I basically live in the crate." : " I dabble in the deep cuts."}
        </p>
      </div>

    </div>
  );
};

export default StatsDashboard;