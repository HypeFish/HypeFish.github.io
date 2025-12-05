// src/lib/spotify.ts
import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const CACHE_FILE = path.join(process.cwd(), '.spotify-cache.json');

// Helper to pause execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

export async function getFullPlaylist() {
  // 1. CHECK CACHE
  if (fs.existsSync(CACHE_FILE)) {
    console.log('⚡ Loading playlist from local cache...');
    try {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } catch (e) {
      console.warn('Cache corrupted, fetching fresh data...');
    }
  }

  console.log('🐢 Cache not found. Fetching full data...');

  try {
    // Initial Auth
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);

    const playlistId = process.env.SPOTIFY_PLAYLIST_ID;
    if (!playlistId) throw new Error('SPOTIFY_PLAYLIST_ID missing');

    const playlistInfo = await spotifyApi.getPlaylist(playlistId);
    console.log(`✅ Playlist found: "${playlistInfo.body.name}"`);
    
    // --- PART A: FETCH TRACKS ---
    let allTracks: any[] = [];
    let offset = 0;
    let limit = 100;
    let keepFetching = true;

    while (keepFetching) {
      const response = await spotifyApi.getPlaylistTracks(playlistId, {
        offset,
        limit,
        fields: 'items(track(name,id,popularity,album(release_date,images),artists(name),external_urls(spotify)))', 
      });

      if (!response.body.items.length) {
        keepFetching = false;
      } else {
        const validItems = response.body.items.filter(i => i.track && i.track.id);
        allTracks = [...allTracks, ...validItems];
        offset += limit;
      }
    }
    console.log(`✅ Fetched ${allTracks.length} tracks.`);

    // --- PART B: FETCH AUDIO FEATURES ---
    console.log(`🎵 Starting Audio Analysis (This will take ~10-15 seconds)...`);
    
    const trackIds = allTracks.map(item => item.track.id);
    const allFeatures = [];

    // FIX: Add a delay loop
    for (let i = 0; i < trackIds.length; i += 100) {
      const batch = trackIds.slice(i, i + 100);
      
      try {
        // 1. Pause for 500ms to avoid Rate Limits (429/403)
        await sleep(500);

        const res = await spotifyApi.getAudioFeaturesForTracks(batch);
        
        if (res.body.audio_features) {
          const validFeatures = res.body.audio_features.filter(f => f !== null);
          allFeatures.push(...validFeatures);
          // console.log(`   - Batch ${i} success (${validFeatures.length} features)`);
        }
      } catch (err: any) {
        // IMPROVED LOGGING
        console.error(`❌ ERROR fetching batch ${i}:`);
        console.error(`   Status: ${err.statusCode}`);
        if (err.body) console.error(`   Message: ${err.body.error?.message || err.message}`);
        
        // If we get rate limited, wait longer
        if (err.statusCode === 429) {
            console.warn('   ⚠️ Rate Limited! Waiting 5 seconds...');
            await sleep(5000);
        }
      }
    }

    console.log(`✅ Fetched ${allFeatures.length} audio feature sets.`);

    // --- PART C: MERGE ---
    const featuresMap = new Map(allFeatures.map(f => [f.id, f]));
    let matchCount = 0;

    const mergedTracks = allTracks.map(item => {
      const features = featuresMap.get(item.track.id);
      if (features) matchCount++;
      return { ...item, audio: features || null };
    });

    console.log(`📊 Merge Report: ${matchCount} / ${allTracks.length} tracks have audio data.`);

    const finalData = {
      name: playlistInfo.body.name,
      description: playlistInfo.body.description,
      tracks: mergedTracks,
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(finalData));
    console.log('💾 Data saved to cache!');

    return finalData;

  } catch (err) {
    console.error('🔥 CRITICAL ERROR:', err);
    return null;
  }
}