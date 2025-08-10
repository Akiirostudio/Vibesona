"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStudioStore } from "../state/store";

export function WaveView() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const zoom = useStudioStore((s) => s.zoom);
  const clips = useStudioStore((s) => s.clips);
  const tracks = useStudioStore((s) => s.tracks);
  const trackOrder = useStudioStore((s) => s.trackOrder);
  const media = useStudioStore((s) => s.media);
  const renderData = useMemo(() => ({ clips, tracks, trackOrder, media }), [clips, tracks, trackOrder, media]);
  const selectClips = useStudioStore((s) => s.selectClips);
  const setCursor = useStudioStore((s) => s.setCursor);
  const nudge = useStudioStore((s) => s.nudgeSelected);
  const cursorSec = useStudioStore((s) => s.cursorSec);
  const select = useStudioStore((s) => s.selectClips);
  const [drag, setDrag] = useState<{ id: string; startX: number; origStart: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth * dpr;
    const height = canvas.clientHeight * dpr;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    const rowHeight = Math.floor(height / Math.max(1, trackOrder.length));
    const pxPerSec = 100 * zoom * dpr;

    trackOrder.forEach((trackId, row) => {
      const track = tracks[trackId];
      const y0 = row * rowHeight;
      const pad = 6 * dpr;
      // Track background (inside padding)
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(pad, y0 + pad, width - pad * 2, rowHeight - pad * 2);

      track.clipIds.forEach((clipId) => {
        const clip = clips[clipId];
        const m = media[clip.mediaId];
        let x = Math.round(clip.startTimeSec * pxPerSec);
        let w = Math.max(1, Math.round(clip.durationSec * pxPerSec));
        const y = y0 + pad;
        const h = rowHeight - pad * 2;
        // clamp to canvas bounds
        if (x < pad) { w -= (pad - x); x = pad; }
        if (x + w > width - pad) { w = Math.max(1, (width - pad) - x); }
        ctx.fillStyle = "rgba(124,58,237,0.28)";
        ctx.fillRect(x, y, w, h);
        // draw a quick waveform approximation if buffer is available
        if (m?.buffer) {
          const ch = m.buffer.getChannelData(0);
          const samplesPerPixel = Math.max(1, Math.floor(ch.length / w));
          ctx.strokeStyle = "rgba(255,255,255,0.7)";
          ctx.beginPath();
          for (let px = 0; px < w; px++) {
            const start = px * samplesPerPixel;
            let min = 1.0, max = -1.0;
            for (let i = 0; i < samplesPerPixel; i++) {
              const v = ch[start + i] || 0;
              if (v < min) min = v;
              if (v > max) max = v;
            }
            const yMin = y + (0.5 - min * 0.5) * h;
            const yMax = y + (0.5 - max * 0.5) * h;
            ctx.moveTo(x + px, yMin);
            ctx.lineTo(x + px, yMax);
          }
          ctx.stroke();
        } else {
          // fallback center line
          ctx.strokeStyle = "rgba(255,255,255,0.6)";
          ctx.beginPath();
          ctx.moveTo(x, y + h / 2);
          ctx.lineTo(x + w, y + h / 2);
          ctx.stroke();
        }
      });
    });

    // draw time-cursor ON TOP
    const cursorX = Math.round(cursorSec * pxPerSec);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(cursorX, 0, Math.max(1, dpr), height);
  }, [zoom, renderData, cursorSec]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const pxPerSec = 100 * zoom * dpr;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    // hit test: select first clip under pointer
    const height = canvas.height;
    const rowHeight = Math.floor(height / Math.max(1, renderData.trackOrder.length));
    const row = Math.floor(y / rowHeight);
    const trackId = renderData.trackOrder[row];
    const track = renderData.tracks[trackId];
    if (!track) { setCursor(x / pxPerSec); return; }
    let hit: string | null = null;
    track.clipIds.forEach((cid) => {
      const c = renderData.clips[cid];
      const cx = Math.round(c.startTimeSec * pxPerSec);
      const cw = Math.max(1, Math.round(c.durationSec * pxPerSec));
      const cy = row * rowHeight + 4 * dpr;
      const ch = rowHeight - 8 * dpr;
      if (x >= cx && x <= cx + cw && y >= cy && y <= cy + ch) hit = cid;
    });
    if (hit) {
      select([hit]);
      const origStart = renderData.clips[hit].startTimeSec;
      setDrag({ id: hit, startX: x, origStart });
    } else {
      select([]);
      setCursor(x / pxPerSec);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const pxPerSec = 100 * zoom * dpr;
    const x = (e.clientX - rect.left) * dpr;
    const deltaPx = x - drag.startX;
    const deltaSec = deltaPx / pxPerSec;
    nudge(deltaSec);
    setDrag((d) => (d ? { ...d, startX: x, origStart: (d.origStart || 0) + deltaSec } : d));
  };

  const onPointerUp = () => setDrag(null);

  const onDragOver = (e: React.DragEvent<HTMLCanvasElement>) => e.preventDefault();

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onDragOver={onDragOver}
    />
  );
}


