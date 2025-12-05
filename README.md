# HypeFish Portfolio 

A high-performance personal portfolio and digital playground built with **Astro**, **React**, and **TypeScript**.

> 🔗 **Live Site:** [https://hypefish.org](https://hypefish.org)

## Tech Stack
* **Framework:** Astro (Static Site Generation + Islands Architecture)
* **UI:** React (Interactive Components), Tailwind CSS (Styling)
* **Data:** Spotify Web API (Music Analysis), Astro Content Collections (Blog)
* **Visuals:** Recharts (Data Viz), React Three Fiber (Experiments)
* **Deployment:** Vercel / Firebase

## Key Features
* **Music DNA Dashboard:** A full-stack data visualization app that fetches my 1000+ song Spotify library, caches it at build-time to avoid API rate limits, and visualizes audio features (Valence vs. Energy) using Recharts.
* **Developer Terminal:** A hidden CLI accessible via the `~` key that allows power users to navigate the site using command-line instructions.
* **Interactive Game:** A Connect-4 implementation with a Minimax AI opponent.
* **Performance:** optimized with View Transitions for a SPA-like feel and scored 100/100 on Lighthouse.

## Running Locally

1.  **Clone the repo:**
    ```bash
    git clone [https://github.com/HypeFish/hypefish.github.io.git](https://github.com/HypeFish/hypefish.github.io.git)
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Environment Variables:**
    Create a `.env` file with your Spotify Credentials:
    ```env
    SPOTIFY_CLIENT_ID=your_id
    SPOTIFY_CLIENT_SECRET=your_secret
    SPOTIFY_PLAYLIST_ID=your_playlist_id
    ```
4.  **Start the dev server:**
    ```bash
    npm start
    ```