"use client";
import { useMemo } from "react";
import { useStudioStore } from "../state/store";
import { Button } from "@/components/ui/Button";

export function TrackList() {
  const trackOrder = useStudioStore((s) => s.trackOrder);
  const tracksMap = useStudioStore((s) => s.tracks);
  const addTrack = useStudioStore((s) => s.addTrack);
  const tracks = useMemo(() => trackOrder.map((id) => tracksMap[id]), [trackOrder, tracksMap]);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Tracks</h3>
        <Button onClick={() => addTrack()}>Add Track</Button>
      </div>
      <ul className="space-y-1">
        {tracks.map((t) => (
          <li key={t.id} className="flex items-center justify-between text-sm text-white/80">
            <span>{t.name}</span>
            <span className="text-white/50">vol {t.volumeDb}dB • pan {Math.round(t.pan * 100)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}


