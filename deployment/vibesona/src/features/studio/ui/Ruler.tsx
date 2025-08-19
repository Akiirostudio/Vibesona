"use client";
import { Timeline } from "./Timeline";

export function Ruler() {
  return (
    <div className="rounded-md border border-white/10 bg-white/5">
      <Timeline seconds={300} />
    </div>
  );
}


