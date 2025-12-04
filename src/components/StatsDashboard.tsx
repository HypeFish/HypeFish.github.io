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

// Custom Tooltip for the Scatter Plot
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
  
  // --- DATA 1: AUDIO FEATURES RADAR ---
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
      { subject: 'Danceability', A: (acc.danceability / count).toFixed(2), fullMark: 1 },
      { subject: 'Energy', A: (acc.energy / count).toFixed(2), fullMark: 1 },
      { subject: 'Speechiness', A: (acc.speechiness / count).toFixed(2), fullMark: 1 },
      { subject: 'Acousticness', A: (acc.acousticness / count).toFixed(2), fullMark: 1 },
      { subject: 'Happiness', A: (acc.valence / count).toFixed(2), fullMark: 1 },
    ];
  }, [tracks]);

  // --- DATA 2: MOOD MAP (Scatter) ---
  const scatterData = useMemo(() => {
    return tracks
      .filter(t => t.audio)
      .map(t => ({
        x: t.audio.valence, // 0 = Sad, 1 = Happy
        y: t.audio.energy,  // 0 = Chill, 1 = Intense
        name: t.track.name,
        artist: t.track.artists[0].name,
        pop: t.track.popularity // We can size bubbles by obscurity if we want
      }));
  }, [tracks]);

  // --- DATA 3: POPULARITY (Simplified for "Underground" Context) ---
  const undergroundScore = useMemo(() => {
    const obscure = tracks.filter(t => (t.track?.popularity || 0) < 20).length;
    return Math.round((obscure / tracks.length) * 100);
  }, [tracks]);

  if (!tracks.length) return <p>No data available.</p>;

  return (
    <div className="stats-dashboard" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* --- ROW 1: THE SONIC FINGERPRINT --- */}
      <div className="chart-section" style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>🕸️ The Sonic Fingerprint</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          The shape of my sound. (Spikes = Dominant traits)
        </p>
        <div style={{ height: '350px', width: '100%', minHeight: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#e0e0e0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
              <Radar
                name="My Library"
                dataKey="A"
                stroke="#8884d8"
                strokeWidth={3}
                fill="#8884d8"
                fillOpacity={0.4}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- ROW 2: THE MOOD MAP --- */}
      <div className="chart-section" style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>🌌 The Mood Map</h2>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Every dot is a song. <br/>
          <small>(Bottom-Left = Depressing/Chill • Top-Right = Happy/Intense)</small>
        </p>
        <div style={{ height: '400px', width: '100%', minHeight: '400px', background: '#f9f9f9', borderRadius: '12px', padding: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Happiness" 
                unit="" 
                domain={[0, 1]} 
                tick={false} 
                label={{ value: '← Sad ... Happy →', position: 'bottom', offset: 0 }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Energy" 
                unit="" 
                domain={[0, 1]} 
                tick={false}
                label={{ value: 'Chill ... Intense', angle: -90, position: 'insideLeft' }} 
              />
              <ZAxis type="number" range={[20, 20]} /> {/* Fixed dot size */}
              <Tooltip content={<CustomTooltip />} />
              <Scatter name="Songs" data={scatterData} fill="#007acc" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- ROW 3: THE UNDERGROUND BADGE --- */}
      <div style={{ 
        background: '#1a1a1a', 
        color: 'white', 
        padding: '2rem', 
        borderRadius: '16px', 
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7 }}>Underground Index</h3>
        <div style={{ fontSize: '4rem', fontWeight: 'bold', margin: '1rem 0', color: '#f1c40f' }}>
          {undergroundScore}%
        </div>
        <p style={{ maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
          Percent of my collection that Spotify classifies as "Obscure" (Popularity &lt; 20).
          {undergroundScore > 50 ? " I basically live in the crate." : " I dabble in the deep cuts."}
        </p>
      </div>

    </div>
  );
};

export default StatsDashboard;