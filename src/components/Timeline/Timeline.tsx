import React, { useEffect, useLayoutEffect, useRef, useState, type JSX } from "react";
import { useProject } from "../../state/ProjectStore";
import { fmtTime } from "../../utils/time";

const NICE_STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
const MIN_LABEL_PX = 64;
const MIN_MINOR_PX = 8;
const pickStep = (pxPerSec: number, minPx = MIN_LABEL_PX) => {
  for (const s of NICE_STEPS) if (s * pxPerSec >= minPx) return s;
  return NICE_STEPS[NICE_STEPS.length - 1];
};

export function Timeline(){
  const { currentSlide, time, selectedId, setSelectedId, setClip } = useProject();
  const [pxPerSec, setPxPerSec] = useState(80);
  const tlRef = useRef<HTMLDivElement | null>(null);
  const [tlScrollLeft, setTlScrollLeft] = useState(0);
  const [tlClientWidth, setTlClientWidth] = useState(0);
  const rowH = 40;

  useLayoutEffect(() => { const el = tlRef.current; if (!el) return; setTlClientWidth(el.clientWidth); setTlScrollLeft(el.scrollLeft); }, []);
  useEffect(() => {
    const el = tlRef.current; if (!el || typeof ResizeObserver==="undefined") return;
    const ro = new ResizeObserver((entries) => setTlClientWidth(entries[0].contentRect.width));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  const dragRef = useRef<{ id: string; mode: "move"|"resize-left"|"resize-right"; startX: number; initStart: number; initDur: number } | null>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { id, mode, startX, initStart, initDur } = dragRef.current;
      const dx = (e.clientX - startX) / pxPerSec;
      if (mode === "move"){ const newStart = Math.max(0, initStart + dx); setClip(id, { start: newStart }); }
      else if (mode === "resize-left"){ const newStart = Math.max(0, initStart + dx); const newDur = Math.max(0.2, initDur - dx); setClip(id, { start: newStart, duration: newDur }); }
      else if (mode === "resize-right"){ const newDur = Math.max(0.2, initDur + dx); setClip(id, { duration: newDur }); }
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [pxPerSec, setClip]);

  const onMouseDownClip = (e: React.MouseEvent, id: string, mode: "move"|"resize-left"|"resize-right") => {
    e.stopPropagation();
    const clip = currentSlide.clips.find(c => c.id === id)!;
    dragRef.current = { id, mode, startX: e.clientX, initStart: clip.start, initDur: clip.duration };
    setSelectedId(id);
  };
  const duration = currentSlide.duration;

  return (
    <div className="flex-1 grid grid-rows-[32px_1fr] ">
      <div className="relative bg-slate-900 border-b border-slate-800 select-none">
        <div className="absolute left-0 top-0 bottom-0 w-40 flex items-center justify-center text-xs text-slate-400">Timeline</div>
        <div className="absolute right-2 top-1.5 flex items-center gap-2 text-xs">
          <button className="px-2 py-0.5 rounded border border-slate-700 hover:bg-slate-800" onClick={()=>setPxPerSec(v=>Math.max(20, v-20))}>–</button>
          <input type="range" min={20} max={400} step={5} value={pxPerSec} onChange={e=>setPxPerSec(parseInt(e.target.value))} className="w-40 accent-sky-500" />
          <button className="px-2 py-0.5 rounded border border-slate-700 hover:bg-slate-800" onClick={()=>setPxPerSec(v=>Math.min(400, v+20))}>+</button>
          <span className="text-slate-400 w-16 text-right">{pxPerSec} px/s</span>
        </div>
        <div className="ml-40 h-full relative" style={{ width: duration * pxPerSec + 200, transform: `translateX(${-tlScrollLeft}px)` }}>
          {(() => {
            const gutter = 40;
            const visibleWidthPx = Math.max(0, tlClientWidth - gutter);
            const startSec = Math.max(0, tlScrollLeft / pxPerSec);
            const endSec = Math.min(duration, (tlScrollLeft + visibleWidthPx) / pxPerSec);
            const major = pickStep(pxPerSec, 64);
            const minorCand = major / 5;
            const minor = minorCand * pxPerSec >= 8 ? minorCand : 0;
            const ticks: JSX.Element[] = [];
            if (minor > 0){
              const firstMinor = Math.floor(startSec / minor) * minor;
              for (let t = firstMinor; t <= endSec; t += minor){ const left = t * pxPerSec; ticks.push(<div key={`mn-${t.toFixed(3)}`} className="absolute top-0 h-full border-l border-slate-800/70" style={{ left }} />); }
            }
            const firstMajor = Math.floor(startSec / major) * major;
            for (let t = firstMajor; t <= endSec; t += major){
              const left = t * pxPerSec;
              ticks.push(<div key={`mj-${t.toFixed(3)}`} className="absolute top-0 h-full border-l border-slate-700" style={{ left }}><div className="-translate-x-1/2 px-1 text-[10px] text-slate-300">{fmtTime(Math.max(0,t))}</div></div>);
            }
            ticks.push(<div key="ph" className="absolute top-0 bottom-0 w-px bg-rose-400" style={{ left: time * pxPerSec }} />);
            return ticks;
          })()}
        </div>
      </div>
      <div ref={tlRef} className="relative bg-slate-950 overflow-auto" onScroll={(e)=>{ setTlScrollLeft(e.currentTarget.scrollLeft); setTlClientWidth(e.currentTarget.clientWidth); }} onMouseDown={()=> setSelectedId(null)}>
        <div className="absolute left-0 top-0 bottom-0 w-40 border-r border-slate-800 text-xs text-slate-400 bg-slate-950">
          {currentSlide.clips.map(c => (<div key={c.id} className="h-10 flex items-center justify-center border-b border-slate-800 truncate" title={c.type}>{c.type}</div>))}
        </div>
        <div className="ml-40 relative" style={{ width: duration * pxPerSec + 200, height: rowH * Math.max(1, currentSlide.clips.length) }}>
          {currentSlide.clips.map((c) => {
            const left = c.start * pxPerSec, width = Math.max(4, c.duration * pxPerSec), selected = selectedId === c.id;
            return (
              <div key={c.id} className="h-10 border-b border-slate-900/60 relative">
                <div className={`absolute top-1 h-6 rounded-md ${selected ? "bg-sky-500" : "bg-slate-700 hover:bg-slate-600"} cursor-grab active:cursor-grabbing`} style={{ left, width }}
                  onMouseDown={(e)=>{ e.stopPropagation(); onMouseDownClip(e, c.id, "move"); }} onClick={(e)=>{ e.stopPropagation(); setSelectedId(c.id); }}
                  title={`${c.name || c.id} (${fmtTime(c.start)} - ${fmtTime(c.start + c.duration)})`}>
                  <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/10 rounded-l" onMouseDown={(e)=>onMouseDownClip(e, c.id, "resize-left")} />
                  <div className="px-2 text-[10px] truncate leading-6">{c.name || c.id}</div>
                  <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/10 rounded-r" onMouseDown={(e)=>onMouseDownClip(e, c.id, "resize-right")} />
                </div>
                <div className="absolute left-0 right-0 top-7 h-2">
                  {(c.actions || []).map(a => {
                    const aLeft = a.start * pxPerSec, aWidth = Math.max(2, (a.end - a.start) * pxPerSec);
                    const color = a.type === "appear" ? "bg-emerald-400" : a.type === "move" ? "bg-indigo-400" : "bg-amber-400";
                    return <div key={a.id} className={`absolute h-2 rounded ${color}`} style={{ left: aLeft, width: aWidth }} title={`${a.type} ${fmtTime(a.start)}-${fmtTime(a.end)}`} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
