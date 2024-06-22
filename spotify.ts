import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const clientId = process.env.SPOTIFY_CLIENT_ID as string;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET as string;
const playlistId = process.env.SPOTIFY_PLAYLIST_ID as string;

const getAccessToken = async (): Promise<string> => {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });
  const data: { access_token: string } = await response.json();
  return data.access_token;
};

interface Track {
  name: string;
  artists: { name: string }[];
  preview_url: string | null;
  external_urls: { spotify: string };
  album: { images: { url: string }[] };
}

interface Playlist {
  name: string;
  description: string;
  tracks: {
    items: { track: Track }[];
    total: number;
  };
}

const getPlaylistTracks = async (accessToken: string, playlistId: string): Promise<Track[]> => {
  let tracks: Track[] = [];
  let offset = 0;
  const limit = 100;
  let total = 0;

  do {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`, {
      headers: {
        Authorization: 'Bearer ' + accessToken
      }
    });
    const data: { items: { track: Track }[]; total: number } = await response.json();
    tracks = tracks.concat(data.items.map((item) => item.track));
    offset += limit;
    total = data.total;
  } while (offset < total);

  return tracks;
};

const getPlaylistDetails = async (accessToken: string, playlistId: string): Promise<Playlist> => {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  });
  const data: Playlist = await response.json();
  return data;
};

(async () => {
  const accessToken = await getAccessToken();
  const playlistDetails = await getPlaylistDetails(accessToken, playlistId);
  const tracks = await getPlaylistTracks(accessToken, playlistId);
  const playlist = {
    name: playlistDetails.name,
    description: playlistDetails.description,
    tracks: {
      items: tracks.map(track => ({ track })),
      total: tracks.length
    }
  };
  fs.writeFileSync(path.resolve(__dirname, './src/data/playlistData.json'), JSON.stringify(playlist, null, 2));
})();
