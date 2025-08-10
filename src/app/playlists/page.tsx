"use client";
import { useEffect, useState } from "react";

type Playlist = {
  id: string;
  title: string;
  description?: string | null;
  spotifyPlaylistId: string;
};

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [spId, setSpId] = useState("");

  const load = async () => {
    const res = await fetch("/api/playlists");
    const data = await res.json();
    setPlaylists(data.playlists || []);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: desc, spotifyPlaylistId: spId }),
    });
    setTitle(""); setDesc(""); setSpId("");
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/playlists?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Playlists</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" className="border rounded px-3 py-2" />
        <input value={desc} onChange={(e)=>setDesc(e.target.value)} placeholder="Description" className="border rounded px-3 py-2" />
        <input value={spId} onChange={(e)=>setSpId(e.target.value)} placeholder="Spotify ID" className="border rounded px-3 py-2" />
      </div>
      <button onClick={create} className="bg-black text-white px-4 py-2 rounded">Create</button>
      <ul className="divide-y">
        {playlists.map(p => (
          <li key={p.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{p.title}</div>
              <div className="text-sm text-gray-600">{p.description}</div>
              <div className="text-xs text-gray-500">Spotify ID: {p.spotifyPlaylistId}</div>
            </div>
            <button onClick={()=>remove(p.id)} className="text-red-600 text-sm">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}


