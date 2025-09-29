import React, { useEffect, useRef } from "react";
import { useProject } from "../state/ProjectStore";
import { fmtTime } from "../utils/time";

export function TransportBar(){
  const { time, setTime, playing, setPlaying, speed, setSpeed, currentSlide, slideIdx, setSlideIdx, project } = useProject();
  const raf = useRef<number| null>(null); const last = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    const tick = (now: number) => {
      if (!last.current) last.current = now;
      const dt = (now - last.current) / 1000 * speed;
      last.current = now;
      const t = time + dt;
      if (t >= currentSlide.duration) {
        if (slideIdx + 1 < project.slides.length) { setSlideIdx(slideIdx + 1); setTime(0); }
        else { setPlaying(false); setTime(currentSlide.duration - 0.0001); }
      } else { setTime(t); raf.current = requestAnimationFrame(tick); }
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; last.current = 0; };
  }, [playing, speed, time, currentSlide.duration, slideIdx, project.slides.length]);

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-slate-900 border-b border-slate-800">
      <button className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={() => setPlaying(v => !v)}>{playing ? "Pause" : "Play"}</button>
      <button className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={() => setTime(0)}>Stop</button>
      <div className="text-xs text-slate-300 ml-2">{fmtTime(time)} / {fmtTime(currentSlide.duration)}</div>
      <div className="ml-4 flex items-center gap-1 text-xs">
        <span>Speed</span>
        <input type="range" min={0.25} max={2} step={0.25} value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} />
        <span>{speed.toFixed(2)}x</span>
      </div>
      <div className="ml-4 flex items-center gap-2">
        <button className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={() => { if (slideIdx>0) { setSlideIdx(slideIdx-1); } }}>Prev</button>
        <button className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={() => { if (slideIdx+1<project.slides.length) { setSlideIdx(slideIdx+1); } }}>Next</button>
      </div>
    </div>
  );
}
