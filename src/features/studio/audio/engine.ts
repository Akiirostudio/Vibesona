import { useStudioStore } from "../state/store";

type ActiveSource = { source: AudioBufferSourceNode; gain: GainNode };

export class StudioEngine {
  private ctx: AudioContext | null = null;
  private destination: AudioNode | null = null;
  private playing = false;
  private active: ActiveSource[] = [];
  private playStartTime = 0;
  private playStartCursor = 0;
  private cursorTimer: number | null = null;

  async ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.destination = this.ctx.destination;
    }
    return this.ctx!;
  }

  private stopAll() {
    this.active.forEach(({ source }) => {
      try { source.stop(); } catch {}
    });
    this.active = [];
    if (this.cursorTimer) {
      clearInterval(this.cursorTimer);
      this.cursorTimer = null;
    }
  }

  private updateCursorPosition() {
    if (!this.playing || !this.ctx) return;
    const elapsed = this.ctx.currentTime - this.playStartTime;
    const newCursor = this.playStartCursor + elapsed;
    useStudioStore.getState().setCursor(newCursor);
  }

  async playFromCursor() {
    const ctx = await this.ensure();
    try { await ctx.resume(); } catch {}
    const state = useStudioStore.getState();
    const startTimeSec = state.cursorSec;
    
    this.stopAll();
    this.playing = true;
    this.playStartTime = ctx.currentTime;
    this.playStartCursor = startTimeSec;

    // Start cursor update timer
    this.cursorTimer = window.setInterval(() => {
      this.updateCursorPosition();
    }, 16); // ~60fps

    const now = ctx.currentTime;
    const scheduleAt = (whenSec: number) => Math.max(now + whenSec, now + 0.01);

    state.trackOrder.forEach((trackId) => {
      const track = state.tracks[trackId];
      track.clipIds.forEach((clipId) => {
        const clip = state.clips[clipId];
        const media = state.media[clip.mediaId];
        if (!media?.buffer) return;
        
        const clipAbsStart = clip.startTimeSec;
        const clipAbsEnd = clip.startTimeSec + clip.durationSec;
        
        // Only play clips that are after or at the cursor position
        if (clipAbsEnd <= startTimeSec) return;
        
        const startDelta = clipAbsStart - startTimeSec; // can be negative
        const when = scheduleAt(startDelta);
        const offsetInClip = Math.max(0, startTimeSec - clipAbsStart);
        const sourceOffset = clip.sourceOffsetSec + offsetInClip / Math.max(0.0001, clip.timeStretchRatio);
        const playDur = Math.max(0.01, clip.durationSec - offsetInClip);

        const source = ctx.createBufferSource();
        source.buffer = media.buffer;
        source.playbackRate.value = Math.max(0.01, clip.timeStretchRatio);
        const gain = ctx.createGain();
        
        // apply simple fades
        const g = gain.gain;
        const lin = Math.pow(10, (clip.gainDb || 0) / 20);
        const fadeIn = Math.min(clip.fadeInSec, playDur * 0.5);
        const fadeOut = Math.min(clip.fadeOutSec, playDur * 0.5);
        g.setValueAtTime(0.0001, when);
        if (fadeIn > 0) {
          g.exponentialRampToValueAtTime(1.0 * lin, when + fadeIn);
        } else {
          g.setValueAtTime(1.0 * lin, when);
        }
        if (fadeOut > 0) {
          g.setValueAtTime(1.0 * lin, when + playDur - fadeOut);
          g.exponentialRampToValueAtTime(0.0001, when + playDur);
        }

        source.connect(gain).connect(this.destination!);
        try {
          source.start(when, Math.max(0, sourceOffset), playDur / Math.max(0.0001, clip.timeStretchRatio));
          this.active.push({ source, gain });
        } catch {}
      });
    });
  }

  async stop() {
    await this.ensure();
    this.stopAll();
    this.playing = false;
  }

  async pause() { 
    await this.stop(); 
  }

  isPlaying() { return this.playing; }
  getContext() { return this.ctx; }
}

export const studioEngine = new StudioEngine();


