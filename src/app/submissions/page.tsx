"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function SubmissionsPage() {
  const [songUrl, setSongUrl] = useState("");
  const [songInfo, setSongInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSongInfo = async () => {
    if (!songUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSongInfo({
        title: "Midnight Dreams",
        artist: "Luna Echo",
        album: "Neon Nights",
        coverArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center",
        duration: 237,
        url: songUrl
      });
    } catch (err) {
      setError("Failed to fetch song information");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Submit Your Music
        </h1>
        <p className="text-white/80 text-lg">
          Get your tracks featured on curated playlists and reach new audiences
        </p>
      </div>

      <Card className="glass border border-white/10">
        <CardHeader>
          <h2 className="text-xl font-semibold">Add Your Song</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              value={songUrl}
              onChange={(e) => setSongUrl(e.target.value)}
              placeholder="Paste your song URL (Spotify, Apple Music, etc.)"
              className="flex-1"
            />
            <Button 
              onClick={fetchSongInfo} 
              disabled={loading || !songUrl.trim()}
              className="px-6"
            >
              {loading ? "Loading..." : "Add Song"}
            </Button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </CardContent>
      </Card>

      {songInfo && (
        <Card className="glass border border-white/10 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center p-6 space-x-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-lg overflow-hidden shadow-2xl">
                  <img 
                    src={songInfo.coverArt} 
                    alt={songInfo.album}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-2xl font-bold text-white">{songInfo.title}</h3>
                <p className="text-lg text-white/80">{songInfo.artist}</p>
                <p className="text-sm text-white/60">{songInfo.album}</p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                  <span className="text-green-400 text-sm font-medium">✓ Verified</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
