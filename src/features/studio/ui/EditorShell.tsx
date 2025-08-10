"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useStudioStore } from "../state/store";
import { studioEngine } from "../audio/engine";
import { Transport } from "./Transport";
import { TrackList } from "./TrackList";
import { Mixer } from "./Mixer";
import { WaveView } from "./WaveView";
import { decodeFileToBuffer } from "../io/import";
import { useMemo } from "react";

export function EditorShell() {
  const addTrack = useStudioStore((s) => s.addTrack);
  const setZoom = useStudioStore((s) => s.setZoom);
  const zoom = useStudioStore((s) => s.zoom);
  const addMedia = useStudioStore((s) => s.addMedia);
  const importAsClip = useStudioStore((s) => s.importAsClip);
  const trackOrder = useStudioStore((s) => s.trackOrder);
  const actions = useMemo(() => ({
    split: useStudioStore.getState().splitSelectedAtCursor,
    splitAll: useStudioStore.getState().splitAtCursorAll,
    trimStart: useStudioStore.getState().trimSelectedStartToCursor,
    trimEnd: useStudioStore.getState().trimSelectedEndToCursor,
    duplicate: useStudioStore.getState().duplicateSelected,
    del: useStudioStore.getState().deleteSelected,
    nudgeL: () => useStudioStore.getState().nudgeSelected(-0.01),
    nudgeR: () => useStudioStore.getState().nudgeSelected(0.01),
    fadeIn: () => useStudioStore.getState().setFadeOnSelected(0.05, 0),
    fadeOut: () => useStudioStore.getState().setFadeOnSelected(0, 0.05),
  }), []);

  // Initial track is created on first import or via the Add Track button

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Transport />
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-white/70">Zoom</span>
          <input type="range" min={1} max={10} value={zoom} onChange={(e)=>setZoom(parseInt(e.target.value))} />
        </div>
      </div>

      <Card className="glass">
        <CardContent className="pt-5 pb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Input
              type="file"
              accept="audio/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const buffer = await decodeFileToBuffer(file);
                const mediaId = `${file.name}_${Date.now()}`;
                addMedia({ id: mediaId, name: file.name, buffer });
                const targetTrack = trackOrder[0] || addTrack("Track 1");
                importAsClip(targetTrack, mediaId);
              }}
            />
          </div>
          <Button onClick={() => addTrack()}>Add Track</Button>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardContent className="pt-5 pb-5">
          <TrackList />
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card className="glass col-span-3">
          <CardContent className="pt-3 pb-3 h-[360px] space-y-2">
            <div className="flex flex-wrap gap-2 text-xs">
              <Button onClick={actions.split}>Split</Button>
              <Button variant="outline" onClick={actions.splitAll}>Split All at Cursor</Button>
              <Button variant="glass" onClick={actions.trimStart}>Trim Start</Button>
              <Button variant="glass" onClick={actions.trimEnd}>Trim End</Button>
              <Button onClick={actions.duplicate}>Duplicate</Button>
              <Button variant="outline" onClick={actions.del}>Delete</Button>
              <Button onClick={actions.nudgeL}>{"<"} Nudge</Button>
              <Button onClick={actions.nudgeR}>Nudge {">"}</Button>
              <Button onClick={actions.fadeIn}>Fade In</Button>
              <Button onClick={actions.fadeOut}>Fade Out</Button>
            </div>
            <div className="rounded-lg overflow-hidden bg-white/5 border border-white/10 h-[300px]">
              <WaveView />
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-5 pb-5"><Mixer /></CardContent>
        </Card>
      </div>
    </div>
  );
}


