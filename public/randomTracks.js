function getRandomTracks(tracks, count) {
    const shuffled = tracks.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  
  function renderTracks(tracks) {
    const trackContainer = document.getElementById('trackList');
    trackContainer.innerHTML = tracks.map(trackItem => {
      const track = trackItem.track;
      if (!track) return '';
      const albumImage = track.album?.images?.[0]?.url || '';
      const artists = track.artists?.map(artist => artist.name).join(', ') || 'Unknown Artist';
      return `
        <div class="track">
          ${albumImage ? `<img src="${albumImage}" alt="${track.name} album cover" />` : ''}
          <div class="track-info">
            <h3>${track.name || 'Unknown Track'}</h3>
            <p>${artists}</p>
          </div>
          ${track.preview_url ? `
            <audio controls>
              <source src="${track.preview_url}" type="audio/mpeg">
              Your browser does not support the audio element.
            </audio>
          ` : ''}
          <a href="${track.external_urls?.spotify || '#'}" target="_blank" rel="noopener noreferrer">Listen on Spotify</a>
        </div>
      `;
    }).join('');
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    try {
      const playlistData = JSON.parse(document.getElementById('playlistData').textContent);
      const randomTracks = getRandomTracks(playlistData.tracks.items, 10);
      renderTracks(randomTracks);
    } catch (error) {
      console.error('Error parsing playlist data:', error);
    }
  });
  