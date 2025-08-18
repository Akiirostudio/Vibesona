"use client";

import { useState } from "react";

interface SongInfo {
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
}

export default function Home() {
  const [songUrl, setSongUrl] = useState("");
  const [songInfo, setSongInfo] = useState<SongInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSongUrlSubmit = async () => {
    if (!songUrl.trim()) return;
    
    setIsLoading(true);
    setError("");
    setSongInfo(null);
    
    try {
      // Extract track ID from Spotify URL
      const trackIdMatch = songUrl.match(/track\/([a-zA-Z0-9]+)/);
      if (!trackIdMatch) {
        throw new Error("Invalid Spotify track URL");
      }
      
      const trackId = trackIdMatch[1];
      
      // Call our Spotify API to get track info
      const response = await fetch(`/api/spotify/track/${trackId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch track information");
      }
      
      const data = await response.json();
      setSongInfo(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load track";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative max-w-6xl mx-auto px-6 py-16">
      <section className="text-center space-y-6">
        <div className="flex flex-col items-center gap-4">
          <img src="/brand/vibesona-logo.png" alt="Vibesona" className="w-16 h-16 object-contain" />
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Intelligent creation. Verified growth.
          </h1>
        </div>
        <p className="text-white/80 max-w-2xl mx-auto">
          Analyze playlists for authenticity, craft tracks in a sleek studio, and submit to curated lists — all in one seamless, next-gen experience.
        </p>
        <div className="flex gap-3 justify-center">
          <a href="/playlist" className="inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#06B6D4] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:opacity-95 focus-visible:ring-[#7C3AED] px-4 py-2">
            Analyze a Playlist
          </a>
          <a href="/studio" className="inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none backdrop-blur bg-white/10 dark:bg-white/5 text-white border border-white/15 hover:bg-white/15 px-4 py-2">
            Open Studio
          </a>
        </div>
      </section>

      {/* Song Submission Section */}
      <section className="mt-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-white mb-2">Submit Your Track</h2>
          <p className="text-white/60">Enter your song link and submit to curated playlists instantly</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* URL Input */}
          <div className="flex gap-3 mb-8">
            <input
              type="url"
              placeholder="Paste your Spotify song URL here..."
              value={songUrl}
              onChange={(e) => setSongUrl(e.target.value)}
              className="flex-1 bg-white/5 border border-white/20 text-white placeholder:text-white/40 rounded-md px-3 py-2"
            />
            <button
              onClick={handleSongUrlSubmit}
              disabled={isLoading || !songUrl.trim()}
              className="inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#06B6D4] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:opacity-95 focus-visible:ring-[#7C3AED] px-8 py-2"
            >
              {isLoading ? "Loading..." : "Load Track"}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Song Display */}
          {songInfo && (
            <div className="space-y-6">
              {/* Song Info Card */}
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] glass p-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <img
                      src={songInfo.album?.images?.[0]?.url || "/placeholder-album.jpg"}
                      alt={songInfo.name}
                      className="w-24 h-24 rounded-lg object-cover shadow-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-1">{songInfo.name}</h3>
                    <p className="text-white/70 mb-2">{songInfo.artists?.map(artist => artist.name).join(", ")}</p>
                    <p className="text-white/60 text-sm mb-2">{songInfo.album?.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-white/60">Track loaded successfully</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Playlist Selection */}
              <div className="text-center">
                <h3 className="text-lg font-medium text-white mb-4">Available Playlists</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] glass p-4 cursor-pointer hover:bg-white/10 transition-all duration-300">
                    <h4 className="font-medium text-white mb-1">Indie Vibes</h4>
                    <p className="text-sm text-white/60 mb-2">Fresh indie tracks with unique soundscapes</p>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span>12,500 followers</span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        5 tokens
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] glass p-4 cursor-pointer hover:bg-white/10 transition-all duration-300">
                    <h4 className="font-medium text-white mb-1">Electronic Dreams</h4>
                    <p className="text-sm text-white/60 mb-2">Atmospheric electronic and ambient music</p>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span>8,900 followers</span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        8 tokens
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] glass p-4 cursor-pointer hover:bg-white/10 transition-all duration-300">
                    <h4 className="font-medium text-white mb-1">Hip Hop Heat</h4>
                    <p className="text-sm text-white/60 mb-2">The hottest hip hop tracks of the moment</p>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span>15,600 followers</span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        10 tokens
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] glass p-4 cursor-pointer hover:bg-white/10 transition-all duration-300">
                    <h4 className="font-medium text-white mb-1">Chill Beats</h4>
                    <p className="text-sm text-white/60 mb-2">Relaxing beats for work and study</p>
                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span>7,200 followers</span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        3 tokens
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => alert("Playlist submission feature coming soon!")}
                  className="inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-gradient-to-r from-[#7C3AED] via-[#2563EB] to-[#06B6D4] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:opacity-95 focus-visible:ring-[#7C3AED] px-8 py-3 text-lg"
                >
                  Submit to Playlists
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        <a href="/playlist" className="block">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] glass p-5 hover:bg-white/10 transition-all duration-300 cursor-pointer group">
            <h3 className="text-lg font-medium group-hover:text-blue-400 transition-colors">Playlist Analyzer</h3>
            <p className="text-white/80 text-sm mt-2">Bot heuristics, popularity trends, and activity freshness.</p>
          </div>
        </a>
        <a href="/studio" className="block">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] glass p-5 hover:bg-white/10 transition-all duration-300 cursor-pointer group">
            <h3 className="text-lg font-medium group-hover:text-blue-400 transition-colors">Studio</h3>
            <p className="text-white/80 text-sm mt-2">Waveform editing, trimming, and export with a modern UI.</p>
          </div>
        </a>
        <a href="/submissions" className="block">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] glass p-5 hover:bg-white/10 transition-all duration-300 cursor-pointer group">
            <h3 className="text-lg font-medium group-hover:text-blue-400 transition-colors">Submissions</h3>
            <p className="text-white/80 text-sm mt-2">Spend tokens to submit to quality-curated playlists.</p>
          </div>
        </a>
      </section>
    </div>
  );
}
