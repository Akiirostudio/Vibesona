"use client";
import { useMemo } from "react";
import { useStudioStore } from "../state/store";

export function Mixer() {
  const trackOrder = useStudioStore((s) => s.trackOrder);
  const tracksMap = useStudioStore((s) => s.tracks);
  const tracks = useMemo(() => trackOrder.map((id) => tracksMap[id]), [trackOrder, tracksMap]);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tracks.map((t) => (
        <div key={t.id} className="rounded-md border border-white/10 bg-white/5 p-3">
          <div className="text-sm font-medium mb-2">{t.name}</div>
          <div className="h-24 bg-white/10 rounded" />
          <div className="text-xs text-white/60 mt-2">vol {t.volumeDb}dB</div>
        </div>
      ))}
    </div>
  );
}


