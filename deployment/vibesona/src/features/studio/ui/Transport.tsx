"use client";
import { Button } from "@/components/ui/Button";
import { studioEngine } from "../audio/engine";
import { useStudioStore } from "../state/store";

export function Transport() {
  const setCursor = useStudioStore((s) => s.setCursor);
  return (
    <div className="flex items-center gap-3">
      <Button onClick={() => studioEngine.playFromCursor()}>Play</Button>
      <Button variant="glass" onClick={() => studioEngine.pause()}>Pause</Button>
      <Button variant="outline" onClick={() => studioEngine.stop()}>Stop</Button>
      <div className="flex items-center gap-2 ml-4">
        <span className="text-xs text-white/70">Cursor</span>
        <input type="number" min={0} step={0.01} className="w-24 bg-white/10 rounded px-2 py-1" onChange={(e)=>setCursor(parseFloat(e.target.value)||0)} />
      </div>
    </div>
  );
}


