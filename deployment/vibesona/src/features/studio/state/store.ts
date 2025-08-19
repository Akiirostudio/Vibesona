import { create } from "zustand";

export type ClipId = string;
export type TrackId = string;

export interface Clip {
  id: ClipId;
  trackId: TrackId;
  mediaId: string;
  name: string;
  startTimeSec: number; // timeline position
  durationSec: number; // audible length
  sourceOffsetSec: number; // start within source buffer
  gainDb: number;
  fadeInSec: number;
  fadeOutSec: number;
  reverse: boolean;
  timeStretchRatio: number; // 1.0 = original
  pitchCents: number; // +/- cents
}

export interface Track {
  id: TrackId;
  name: string;
  armed: boolean;
  volumeDb: number;
  pan: number; // -1..1
  clipIds: ClipId[];
}

export interface Marker { id: string; timeSec: number; name: string }

export interface StudioState {
  media: Record<string, { id: string; name: string; durationSec: number; sampleRate: number; channels: number; buffer: AudioBuffer }>;
  tracks: Record<TrackId, Track>;
  clips: Record<ClipId, Clip>;
  trackOrder: TrackId[];
  selection: { clipIds: ClipId[] };
  loop: { enabled: boolean; startSec: number; endSec: number };
  cursorSec: number;
  zoom: number;
  markers: Marker[];
  projectName: string;

  // actions
  addTrack(name?: string): TrackId;
  removeTrack(id: TrackId): void;
  addClip(clip: Clip): void;
  updateClip(id: ClipId, patch: Partial<Clip>): void;
  splitClip(id: ClipId, atSec: number): void;
  selectClips(ids: ClipId[]): void;
  setLoop(loop: Partial<StudioState["loop"]>): void;
  setCursor(timeSec: number): void;
  setZoom(zoom: number): void;

  // media/import helpers
  addMedia(media: { id: string; name: string; buffer: AudioBuffer }): void;
  importAsClip(trackId: TrackId, mediaId: string): ClipId | null;

  // edit ops
  splitSelectedAtCursor(): void;
  trimSelectedStartToCursor(): void;
  trimSelectedEndToCursor(): void;
  duplicateSelected(): void;
  deleteSelected(): void;
  nudgeSelected(deltaSec: number): void;
  setFadeOnSelected(fadeInSec: number, fadeOutSec: number): void;
  normalizeSelectedPeak(): void;
  splitAtCursorAll(): void;
}

let clipCounter = 0;
let trackCounter = 0;

export const useStudioStore = create<StudioState>((set, get) => ({
  media: {},
  tracks: {},
  clips: {},
  trackOrder: [],
  selection: { clipIds: [] },
  loop: { enabled: false, startSec: 0, endSec: 0 },
  cursorSec: 0,
  zoom: 1,
  markers: [],
  projectName: "Untitled Project",

  addTrack: (name = `Track ${++trackCounter}`) => {
    const id = `track_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const track: Track = { id, name, armed: false, volumeDb: 0, pan: 0, clipIds: [] };
    set((s) => ({ tracks: { ...s.tracks, [id]: track }, trackOrder: [...s.trackOrder, id] }));
    return id;
  },
  removeTrack: (id) => set((s) => {
    const { [id]: _, ...rest } = s.tracks;
    const remainingClips = { ...s.clips };
    Object.values(s.clips).forEach((c) => { if (c.trackId === id) delete remainingClips[c.id]; });
    return { tracks: rest, clips: remainingClips, trackOrder: s.trackOrder.filter(t => t !== id) };
  }),
  addClip: (clip) => set((s) => {
    const id = clip.id || `clip_${++clipCounter}`;
    const track = s.tracks[clip.trackId];
    if (!track) return {} as any;
    return {
      clips: { ...s.clips, [id]: { ...clip, id } },
      tracks: { ...s.tracks, [clip.trackId]: { ...track, clipIds: [...track.clipIds, id] } },
    };
  }),
  updateClip: (id, patch) => set((s) => ({ clips: { ...s.clips, [id]: { ...s.clips[id], ...patch } } })),
  splitClip: (id, atSec) => set((s) => {
    const clip = s.clips[id];
    if (!clip) return {} as any;
    const splitTimeInSource = clip.sourceOffsetSec + (atSec - clip.startTimeSec) / clip.timeStretchRatio;
    const left: Clip = { ...clip, durationSec: atSec - clip.startTimeSec };
    const rightId = `clip_${++clipCounter}`;
    const right: Clip = {
      ...clip,
      id: rightId,
      startTimeSec: atSec,
      durationSec: clip.startTimeSec + clip.durationSec - atSec,
      sourceOffsetSec: splitTimeInSource,
    };
    const track = s.tracks[clip.trackId];
    const idx = track.clipIds.indexOf(id);
    const clipIds = [...track.clipIds];
    clipIds.splice(idx + 1, 0, rightId);
    return {
      clips: { ...s.clips, [id]: left, [rightId]: right },
      tracks: { ...s.tracks, [clip.trackId]: { ...track, clipIds } },
      selection: { clipIds: [id, rightId] },
    };
  }),
  selectClips: (ids) => set(() => ({ selection: { clipIds: ids } })),
  setLoop: (loop) => set((s) => ({ loop: { ...s.loop, ...loop } })),
  setCursor: (timeSec) => set(() => ({ cursorSec: timeSec })),
  setZoom: (zoom) => set(() => ({ zoom })),

  addMedia: (media) => set((s) => ({
    media: {
      ...s.media,
      [media.id]: {
        id: media.id,
        name: media.name,
        buffer: media.buffer,
        durationSec: media.buffer.duration,
        sampleRate: media.buffer.sampleRate,
        channels: media.buffer.numberOfChannels,
      },
    },
  })),
  importAsClip: (trackId, mediaId) => {
    const s = get();
    const media = s.media[mediaId];
    const track = s.tracks[trackId];
    if (!media || !track) return null;
    const id = `clip_${++clipCounter}`;
    const clip: Clip = {
      id,
      trackId,
      mediaId,
      name: media.name,
      startTimeSec: 0,
      durationSec: media.durationSec,
      sourceOffsetSec: 0,
      gainDb: 0,
      fadeInSec: 0,
      fadeOutSec: 0,
      reverse: false,
      timeStretchRatio: 1,
      pitchCents: 0,
    };
    set((s2) => ({
      clips: { ...s2.clips, [id]: clip },
      tracks: { ...s2.tracks, [trackId]: { ...s2.tracks[trackId], clipIds: [...s2.tracks[trackId].clipIds, id] } },
      selection: { clipIds: [id] },
    }));
    return id;
  },
  splitSelectedAtCursor: () => set((s) => {
    const at = s.cursorSec;
    const ids = s.selection.clipIds;
    ids.forEach((id) => {
      const c = s.clips[id];
      if (!c) return;
      if (at > c.startTimeSec && at < c.startTimeSec + c.durationSec) {
        // reuse existing split logic
        (useStudioStore.getState().splitClip)(id, at);
      }
    });
    return {} as any;
  }),
  trimSelectedStartToCursor: () => set((s) => {
    const at = s.cursorSec;
    const next = { ...s.clips };
    s.selection.clipIds.forEach((id) => {
      const c = next[id]; if (!c) return;
      const end = c.startTimeSec + c.durationSec;
      if (at > c.startTimeSec && at < end) {
        const delta = at - c.startTimeSec;
        c.startTimeSec = at;
        c.durationSec = end - at;
        c.sourceOffsetSec += delta / Math.max(0.0001, c.timeStretchRatio);
      }
    });
    return { clips: next };
  }),
  trimSelectedEndToCursor: () => set((s) => {
    const at = s.cursorSec;
    const next = { ...s.clips };
    s.selection.clipIds.forEach((id) => {
      const c = next[id]; if (!c) return;
      if (at > c.startTimeSec) {
        c.durationSec = Math.max(0.01, at - c.startTimeSec);
      }
    });
    return { clips: next };
  }),
  duplicateSelected: () => set((s) => {
    const nextClips = { ...s.clips };
    const nextTracks = { ...s.tracks };
    const newIds: ClipId[] = [];
    s.selection.clipIds.forEach((id) => {
      const c = s.clips[id]; if (!c) return;
      const newId = `clip_${++clipCounter}`;
      const copy: Clip = { ...c, id: newId, startTimeSec: c.startTimeSec + c.durationSec + 0.05 };
      nextClips[newId] = copy;
      nextTracks[c.trackId] = { ...nextTracks[c.trackId], clipIds: [...nextTracks[c.trackId].clipIds, newId] };
      newIds.push(newId);
    });
    return { clips: nextClips, tracks: nextTracks, selection: { clipIds: newIds } };
  }),
  deleteSelected: () => set((s) => {
    const nextClips = { ...s.clips };
    const nextTracks = { ...s.tracks };
    s.selection.clipIds.forEach((id) => {
      const c = s.clips[id]; if (!c) return;
      delete nextClips[id];
      nextTracks[c.trackId] = { ...nextTracks[c.trackId], clipIds: nextTracks[c.trackId].clipIds.filter((x) => x !== id) };
    });
    return { clips: nextClips, tracks: nextTracks, selection: { clipIds: [] } };
  }),
  nudgeSelected: (deltaSec) => set((s) => {
    const next = { ...s.clips };
    s.selection.clipIds.forEach((id) => { const c = next[id]; if (c) c.startTimeSec = Math.max(0, c.startTimeSec + deltaSec); });
    return { clips: next };
  }),
  setFadeOnSelected: (fadeInSec, fadeOutSec) => set((s) => {
    const next = { ...s.clips };
    s.selection.clipIds.forEach((id) => { const c = next[id]; if (c) { c.fadeInSec = fadeInSec; c.fadeOutSec = fadeOutSec; } });
    return { clips: next };
  }),
  normalizeSelectedPeak: () => set((s) => {
    const next = { ...s.clips };
    s.selection.clipIds.forEach((id) => { const c = next[id]; if (c) c.gainDb = 0; });
    return { clips: next };
  }),
  splitAtCursorAll: () => set((s) => {
    const at = s.cursorSec;
    const newState = useStudioStore.getState();
    Object.values(s.clips).forEach((c) => {
      const end = c.startTimeSec + c.durationSec;
      if (at > c.startTimeSec && at < end) {
        newState.splitClip(c.id, at);
      }
    });
    return {} as any;
  }),
}));


