// src/lib/spotify.ts
import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const CACHE_FILE = path.join(process.cwd(), '.spotify-cache.json');

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

  console.log('🐢 Cache not found. Fetching full data (Tracks + Audio Features)...');

  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);

    const playlistId = process.env.SPOTIFY_PLAYLIST_ID;
    if (!playlistId) throw new Error('SPOTIFY_PLAYLIST_ID missing');

    const playlistInfo = await spotifyApi.getPlaylist(playlistId);
    
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
        // Filter out null tracks immediately
        const validItems = response.body.items.filter(i => i.track && i.track.id);
        allTracks = [...allTracks, ...validItems];
        offset += limit;
      }
    }


    // --- PART B: FETCH AUDIO FEATURES ---
    console.log(`🎵 Fetching audio analysis for ${allTracks.length} tracks...`);
    
    const trackIds = allTracks.map(item => item.track.id);
    const allFeatures = [];

    // FIX: Use a normal loop instead of Promise.all to prevent 403 errors
    for (let i = 0; i < trackIds.length; i += 100) {
      const batch = trackIds.slice(i, i + 100);
      
      try {
        // Wait for this request to finish before starting the next one
        const res = await spotifyApi.getAudioFeaturesForTracks(batch);
        
        if (res.body.audio_features) {
          allFeatures.push(...res.body.audio_features);
        }
        
        // Optional: Add a tiny pause to be extra polite to the API
        // await new Promise(r => setTimeout(r, 100)); 
        
      } catch (err) {
        console.warn(`⚠️ Failed to fetch features for batch ${i}-${i+100}. Skipping.`);
        // Continue to next batch instead of crashing
      }
    }

    // Merge features into the track objects
    // We use a Map for O(1) lookup to be safe
    const featuresMap = new Map(allFeatures.filter(f => f).map(f => [f.id, f]));

    const mergedTracks = allTracks.map(item => {
      const features = featuresMap.get(item.track.id);
      return {
        ...item,
        audio: features || null 
      };
    });

    const finalData = {
      name: playlistInfo.body.name,
      description: playlistInfo.body.description,
      tracks: mergedTracks,
    };

    fs.writeFileSync(CACHE_FILE, JSON.stringify(finalData));
    console.log('✅ Data saved to cache!');

    return finalData;

  } catch (err) {
    console.error('Error fetching Spotify playlist:', err);
    return null;
  }
}