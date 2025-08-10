"use client";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function PlaylistAnalyzerPage() {
  const [playlistId, setPlaylistId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const parsePlaylistId = (input: string) => {
    try {
      // Accept full URL or raw ID
      if (input.includes("open.spotify.com/playlist/")) {
        const url = new URL(input);
        const parts = url.pathname.split("/").filter(Boolean);
        const idx = parts.indexOf("playlist");
        if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
      }
      return input;
    } catch {
      return input;
    }
  };

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const id = parsePlaylistId(playlistId);
      const res = await fetch("/api/playlist/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Playlist Analyzer</h1>
      <Card className="glass">
        <CardContent className="pt-5 pb-5 space-y-3">
          <Input
            value={playlistId}
            onChange={(e) => setPlaylistId(e.target.value)}
            placeholder="Paste Spotify playlist link or ID"
          />
          <Button onClick={analyze} disabled={loading || !playlistId}>
            {loading ? "Analyzing..." : "Analyze"}
          </Button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </CardContent>
      </Card>
      {result && (
        <Card className="glass">
          <CardHeader>
            <h2 className="text-lg font-medium">Results</h2>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-white/60">Track Count</div>
              <div className="text-xl font-semibold">{result.trackCount}</div>
            </div>
            <div>
              <div className="text-sm text-white/60">Average Popularity</div>
              <div className="text-xl font-semibold">{result.averagePopularity}</div>
            </div>
            <div>
              <div className="text-sm text-white/60">Added Within 30 Days</div>
              <div className="text-xl font-semibold">{result.addedWithin30Days}</div>
            </div>
            <div>
              <div className="text-sm text-white/60">Suspected Bots Score</div>
              <div className="text-xl font-semibold">{result.suspectedBotsScore}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


