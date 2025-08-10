"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import WaveSurfer from "wavesurfer.js";
// Wavesurfer v7 plugins (ESM builds)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Timeline from "wavesurfer.js/dist/plugins/timeline.esm.js";
// @ts-ignore
import Regions from "wavesurfer.js/dist/plugins/regions.esm.js";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

type Region = { id: string; start: number; end: number };

export default function StudioPage() {
  const waveContainerRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const waveRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
  const [zoom, setZoom] = useState<number>(0);
  const [activeRegion, setActiveRegion] = useState<Region | null>(null);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!waveContainerRef.current) return;
    const ws = WaveSurfer.create({
      container: waveContainerRef.current,
      waveColor: "rgba(255,255,255,0.5)",
      progressColor: "#7C3AED",
      cursorColor: "#fff",
      height: 120,
      normalize: true,
      minPxPerSec: 60,
      autoCenter: true,
    });
    // Register plugins
    const timeline = ws.registerPlugin(
      // @ts-ignore
      Timeline.create({ container: timelineRef.current })
    );
    const regions = ws.registerPlugin(
      // @ts-ignore
      Regions.create()
    );
    regions.enableDragSelection({ color: "rgba(124,58,237,0.2)" });
    regions.on("region-created", (r: any) => {
      setActiveRegion({ id: r.id, start: r.start, end: r.end });
    });
    regions.on("region-updated", (r: any) => {
      setActiveRegion({ id: r.id, start: r.start, end: r.end });
    });
    regions.on("region-clicked", (r: any) => {
      setActiveRegion({ id: r.id, start: r.start, end: r.end });
    });
    regionsPluginRef.current = regions;
    waveRef.current = ws;
    return () => {
      ws.destroy();
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      const coreURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js";
      const wasmURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.wasm";
      const workerURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.worker.js";
      const instance = new FFmpeg();
      await instance.load({ coreURL, wasmURL, workerURL });
      setFfmpeg(instance);
    };
    load();
  }, []);

  useEffect(() => {
    if (file && waveRef.current) {
      const url = URL.createObjectURL(file);
      waveRef.current.load(url);
      setExportUrl(null);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const onZoom = (value: number) => {
    setZoom(value);
    // wavesurfer v7 zoom expects a number (pixelsPerSecond)
    waveRef.current?.zoom(60 + value * 20);
  };

  const cutRegion = async () => {
    if (!file || !ffmpeg || !activeRegion) return;
    const { start, end } = activeRegion;
    const inputName = "input.wav";
    const outputName = "cut.wav";
    const arrayBuffer = await file.arrayBuffer();
    await ffmpeg.writeFile(inputName, new Uint8Array(arrayBuffer));
    // Export the selected region only
    await ffmpeg.exec([
      "-i",
      inputName,
      "-ss",
      String(start),
      "-to",
      String(end),
      "-c",
      "copy",
      outputName,
    ]);
    const out = (await ffmpeg.readFile(outputName)) as Uint8Array;
    const blob = new Blob([out.buffer as ArrayBuffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    setExportUrl(url);
  };

  const fadeInOut = async () => {
    if (!file || !ffmpeg || !activeRegion) return;
    const { start, end } = activeRegion;
    const inputName = "input.wav";
    const outputName = "fade.wav";
    const arrayBuffer = await file.arrayBuffer();
    await ffmpeg.writeFile(inputName, new Uint8Array(arrayBuffer));
    // Apply fade in/out on the selected region duration
    const duration = Math.max(0.01, end - start);
    await ffmpeg.exec([
      "-i",
      inputName,
      "-af",
      `afade=t=in:st=${start}:d=${Math.min(1, duration / 4)},afade=t=out:st=${Math.max(
        start,
        end - Math.min(1, duration / 4)
      )}:d=${Math.min(1, duration / 4)}`,
      outputName,
    ]);
    const out = (await ffmpeg.readFile(outputName)) as Uint8Array;
    const blob = new Blob([out.buffer as ArrayBuffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    setExportUrl(url);
  };

  const clearRegions = () => {
    regionsPluginRef.current?.clear();
    setActiveRegion(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      <h1 className="text-3xl font-semibold">Studio</h1>

      <Card className="glass">
        <CardContent className="pt-5 pb-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <div className="md:col-span-2">
            <Input type="file" accept="audio/*" onChange={onFileChange} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => waveRef.current?.playPause()} disabled={!file}>Play/Pause</Button>
            <Button variant="glass" onClick={() => waveRef.current?.stop()} disabled={!file}>Stop</Button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/70">Zoom</span>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={zoom}
              onChange={(e) => onZoom(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardContent className="pt-5 pb-5 space-y-2">
          <div ref={waveContainerRef} className="w-full h-[140px] rounded-md bg-white/5" />
          <div ref={timelineRef} className="w-full h-6 text-xs text-white/70" />
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <h3 className="font-medium">Region Tools</h3>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 items-center">
          <Button onClick={clearRegions} variant="outline">Clear Regions</Button>
          <Button onClick={cutRegion} disabled={!activeRegion || !file || !ffmpeg}>Export Selection</Button>
          <Button onClick={fadeInOut} variant="glass" disabled={!activeRegion || !file || !ffmpeg}>Fade In/Out</Button>
          {activeRegion && (
            <span className="text-sm text-white/70">Selection: {activeRegion.start.toFixed(2)}s → {activeRegion.end.toFixed(2)}s</span>
          )}
        </CardContent>
      </Card>

      {exportUrl && (
        <Card className="glass">
          <CardHeader>
            <h3 className="font-medium">Rendered Output</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            <audio controls src={exportUrl} />
            <a className="underline text-sm" href={exportUrl} download>
              Download WAV
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


