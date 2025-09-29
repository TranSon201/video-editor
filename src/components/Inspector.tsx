import React from "react";
import { useProject } from "../state/ProjectStore";

export function Inspector(){
  const { currentSlide, selectedId, setClip, removeClip } = useProject();
  const selected = currentSlide.clips.find(c => c.id === selectedId) || null;
  if (!selected) return <div className="p-3 text-sm text-slate-400"><div className="font-semibold mb-2">Inspector</div><div>Chọn một clip để chỉnh sửa.</div></div>;

  const onNum = (v: any, def=0) => Number.isFinite(Number(v)) ? Number(v) : def;

  return (
    <div className="p-3 space-y-3 text-sm">
      <div className="font-semibold">Inspector</div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-slate-400">Start</label>
        <input className="bg-slate-900 border border-slate-700 rounded px-2 py-1" value={selected.start} onChange={(e)=> setClip(selected.id, { start: Math.max(0, onNum(e.target.value, 0)) })} />
        <label className="text-slate-400">Duration</label>
        <input className="bg-slate-900 border border-slate-700 rounded px-2 py-1" value={selected.duration} onChange={(e)=> setClip(selected.id, { duration: Math.max(0.2, onNum(e.target.value, 1)) })} />
        <label className="text-slate-400">Layer</label>
        <input className="bg-slate-900 border border-slate-700 rounded px-2 py-1" value={selected.layer} onChange={(e)=> setClip(selected.id, { layer: onNum(e.target.value, selected.layer) })} />
        <label className="text-slate-400">In Anim</label>
        <select className="bg-slate-900 border border-slate-700 rounded px-2 py-1" value={selected.inAnim || "none"} onChange={(e)=> setClip(selected.id, { inAnim: e.target.value as any })}>
          {["none","fadeIn","slideInLeft","slideInRight","slideInTop","slideInBottom","scaleIn","rotateIn","zoomIn","blurIn","bounceIn"].map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        <label className="text-slate-400">Out Anim</label>
        <select className="bg-slate-900 border border-slate-700 rounded px-2 py-1" value={selected.outAnim || "fadeOut"} onChange={(e)=> setClip(selected.id, { outAnim: e.target.value as any })}>
          {["fadeOut","slideInLeft","slideInRight","slideInTop","slideInBottom","scaleOut","rotateOut","zoomOut"].map(x => <option key={x} value={x}>{x}</option>)}
        </select>
      </div>
      {selected.type === "text" && (
        <div className="space-y-2">
          <div className="text-slate-400">Text</div>
          <textarea className="w-full h-20 bg-slate-900 border border-slate-700 rounded px-2 py-1" value={selected.text?.content || ""} onChange={(e)=> setClip(selected.id, { text: { ...(selected.text||{}), content: e.target.value } })} />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-slate-400">Font size</label>
            <input className="bg-slate-900 border border-slate-700 rounded px-2 py-1" value={selected.text?.fontSize || 48} onChange={(e)=> setClip(selected.id, { text: { ...(selected.text||{}), fontSize: onNum(e.target.value, 48) } })} />
            <label className="text-slate-400">Color</label>
            <input type="color" className="bg-slate-900 border border-slate-700 rounded px-2 py-1" value={selected.text?.color || "#ffffff"} onChange={(e)=> setClip(selected.id, { text: { ...(selected.text||{}), color: e.target.value } })} />
          </div>
        </div>
      )}
      {selected.type === "image" && (
        <div className="space-y-2">
          <div className="text-slate-400">Image</div>
          <input className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1" placeholder="Image URL" value={selected.image?.src || ""} onChange={(e)=> setClip(selected.id, { image: { ...(selected.image||{}), src: e.target.value } })} />
        </div>
      )}
      {selected.type === "audio" && (
        <div className="space-y-2">
          <div className="text-slate-400">Audio</div>
          <input className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1" placeholder="Audio URL" value={selected.audio?.src || ""} onChange={(e)=> setClip(selected.id, { audio: { ...(selected.audio||{}), src: e.target.value } })} />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-slate-400">Volume</label>
            <input type="range" min={0} max={1} step={0.01} value={selected.audio?.volume ?? 1} onChange={(e)=> setClip(selected.id, { audio: { ...(selected.audio||{}), volume: parseFloat(e.target.value) } })} />
          </div>
        </div>
      )}
      {selected.type === "shape" && (
        <div className="space-y-2">
          <div className="text-slate-400">Shape</div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-slate-400">Kind</label>
            <select className="bg-slate-900 border border-slate-700 rounded px-2 py-1" value={selected.shape?.kind || "rect"} onChange={(e)=> setClip(selected.id, { shape: { ...(selected.shape||{}), kind: e.target.value as any } })}>
              <option value="rect">rect</option><option value="circle">circle</option><option value="triangle">triangle</option>
            </select>
            <label className="text-slate-400">Fill</label>
            <input type="color" className="bg-slate-900 border border-slate-700 rounded px-2 py-1" value={selected.shape?.fill || "#22c55e"} onChange={(e)=> setClip(selected.id, { shape: { ...(selected.shape||{}), fill: e.target.value } })} />
          </div>
        </div>
      )}
      <div className="pt-2"><button className="px-2 py-1 rounded border border-red-600 text-red-400 hover:bg-red-600/10" onClick={()=> removeClip(selected.id)}>Delete Clip</button></div>
    </div>
  );
}
