"use client";
import { useEffect, useState } from "react";

export default function SubmissionsPage() {
  const [playlistId, setPlaylistId] = useState("");
  const [trackUrl, setTrackUrl] = useState("");
  const [available, setAvailable] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/submissions");
    const data = await res.json();
    setAvailable(data.playlists || []);
  };
  
  useEffect(() => { load(); }, []);

  const submit = async () => {
    setMessage(null);
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlistId, trackUrl }),
    });
    const data = await res.json();
    if (!res.ok) setMessage(data.error || "Failed");
    else setMessage("Submitted!");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Submit to Playlists</h1>
      <div>
        <h2 className="font-medium mb-2">Available Playlists</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {available.map((p) => (
            <button key={p.id} onClick={() => setPlaylistId(p.id)} className={`border rounded p-3 text-left ${playlistId===p.id?"border-black":""}`}>
              <div className="font-medium">{p.title}</div>
              <div className="text-sm text-gray-600">{p.description}</div>
              <div className="text-xs text-gray-500">Spotify ID: {p.spotifyPlaylistId}</div>
            </button>
          ))}
        </div>
      </div>
      <p>Browse available playlists and spend tokens to submit.</p>
      <input
        value={playlistId}
        onChange={(e) => setPlaylistId(e.target.value)}
        placeholder="Target Playlist ID"
        className="w-full border rounded px-3 py-2"
      />
      <input
        value={trackUrl}
        onChange={(e) => setTrackUrl(e.target.value)}
        placeholder="Your Track URL"
        className="w-full border rounded px-3 py-2"
      />
      <button onClick={submit} className="bg-black text-white px-4 py-2 rounded">Submit</button>
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}


