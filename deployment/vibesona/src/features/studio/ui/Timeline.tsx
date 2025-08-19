"use client";
import { useEffect, useRef } from "react";
import { useStudioStore } from "../state/store";

export function Timeline({ seconds = 120 }: { seconds?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const zoom = useStudioStore((s) => s.zoom);

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
    ctx.fillStyle = "rgba(255,255,255,0.15)";

    const pxPerSec = 100 * zoom;
    for (let s = 0; s <= seconds; s += 1) {
      const x = Math.round(s * pxPerSec * dpr);
      const isMajor = s % 5 === 0;
      const h = isMajor ? height : height * 0.5;
      ctx.fillRect(x, height - h, dpr, h);
      if (isMajor) {
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = `${12 * dpr}px sans-serif`;
        ctx.fillText(`${s}s`, x + 4 * dpr, 14 * dpr);
        ctx.fillStyle = "rgba(255,255,255,0.15)";
      }
    }
  }, [zoom, seconds]);

  return <canvas ref={canvasRef} className="w-full h-8" />;
}


