import React from "react";
import { useProject } from "../state/ProjectStore";
import { Slide } from "../types";

export function LeftBar(){
  const {
    project, slideIdx, setSlideIdx,
    addSlide, duplicateSlide, removeSlide, moveSlide, updateSlide,
    addClip
  } = useProject();
  const s = project.slides[slideIdx];

  const addText   = () => addClip({ id:`t_${Date.now()}`, type:"text", start:0, duration:3, layer:10, x:50,y:50,w:60,h:20,
    text:{ content:"New Text", fontSize:48, color:"#ffffff", align:"center", fontWeight:700 } });
  const addImage  = () => addClip({ id:`i_${Date.now()}`, type:"image", start:0, duration:4, layer:8, x:50,y:60,w:40,h:40, image:{ src:"" } });
  const addAudio  = () => addClip({ id:`a_${Date.now()}`, type:"audio", start:0, duration:s.duration, layer:1, audio:{ src:"", volume:1 } });
  const addRect   = () => addClip({ id:`r_${Date.now()}`, type:"shape", start:0, duration:3, layer:6, x:50,y:50,w:20,h:20, shape:{ kind:"rect", fill:"#22c55e" } });
  const addCircle = () => addClip({ id:`c_${Date.now()}`, type:"shape", start:0, duration:3, layer:6, x:50,y:50,w:20,h:20, shape:{ kind:"circle", fill:"#22c55e" } });
  const addTri    = () => addClip({ id:`g_${Date.now()}`, type:"shape", start:0, duration:3, layer:6, x:50,y:50,w:20,h:20, shape:{ kind:"triangle", fill:"#22c55e" } });

  const slideItem = (slide: Slide, i: number) => (
    <button key={slide.id} onClick={()=>setSlideIdx(i)}
      className={`w-full text-left px-2 py-1 rounded border ${i===slideIdx ? "border-sky-500 bg-sky-500/10" : "border-slate-800 hover:bg-slate-800/60"} flex items-center justify-between`}>
      <div className="truncate">
        <div className="text-xs">{i+1}. {slide.name}</div>
        <div className="text-[10px] text-slate-400">{slide.duration}s</div>
      </div>
      <div className="text-[10px] text-slate-400">{(slide as any).enabled===false ? "hidden" : ""}</div>
    </button>
  );

  return (
    <div className="h-full bg-slate-900 border border-slate-800 rounded-md p-2 flex flex-col gap-3">
      {/* Slide list */}
      <div>
        <div className="text-xs text-slate-400 mb-2">Slides</div>
        <div className="space-y-1 max-h-64 overflow-auto">
          {project.slides.map(slideItem)}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <button className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={()=>addSlide()}>+ Slide</button>
          <button className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={()=>duplicateSlide(slideIdx)}>Duplicate</button>
          <button className="px-2 py-1 rounded border border-red-700 text-red-400 hover:bg-red-900/20" onClick={()=>removeSlide(slideIdx)}>Delete</button>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          <button disabled={slideIdx<=0} className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={()=>moveSlide(slideIdx, slideIdx-1)}>↑ Move up</button>
          <button disabled={slideIdx>=project.slides.length-1} className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={()=>moveSlide(slideIdx, slideIdx+1)}>↓ Move down</button>
        </div>
      </div>

      {/* Slide properties */}
      <div className="border-t border-slate-800 pt-2">
        <div className="text-xs text-slate-400 mb-2">Slide Properties</div>
        <div className="space-y-2 text-sm">
          <div>
            <label className="block text-slate-400 text-xs">Name</label>
            <input className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded"
              value={s.name} onChange={e=>updateSlide(slideIdx,{name:e.target.value})}/>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={(s as any).enabled!==false}
              onChange={e=>updateSlide(slideIdx,{enabled:e.target.checked} as any)} />
            <span>Show (include in playback)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 text-xs">Bg color</label>
              <input type="color" className="w-full h-8 bg-slate-950 border border-slate-700 rounded"
                value={s.bgColor || "#000000"} onChange={e=>updateSlide(slideIdx,{bgColor:e.target.value})}/>
            </div>
            <div>
              <label className="block text-slate-400 text-xs">Bg image URL</label>
              <input className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded"
                value={s.bgImage || ""} onChange={e=>updateSlide(slideIdx,{bgImage:e.target.value})} placeholder="https://..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 text-xs">Transition In</label>
              <select className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded"
                value={s.transition.in} onChange={e=>updateSlide(slideIdx,{transition:{...s.transition,in:e.target.value as any}})}>
                {["fade","moveLeft","moveRight","moveUp","moveDown","flipX","flipY","zoomIn","zoomOut","scaleIn","scaleOut","rotateIn","rotateOut","skewLeft","skewRight","kenBurns","drape","wipe","split"].map(x=><option key={x} value={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs">Transition Out</label>
              <select className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded"
                value={s.transition.out} onChange={e=>updateSlide(slideIdx,{transition:{...s.transition,out:e.target.value as any}})}>
                {["fade","moveLeft","moveRight","moveUp","moveDown","flipX","flipY","zoomIn","zoomOut","scaleIn","scaleOut","rotateIn","rotateOut","skewLeft","skewRight","kenBurns","drape","wipe","split"].map(x=><option key={x} value={x}>{x}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Add Clip palette */}
      <div className="border-t border-slate-800 pt-2">
        <div className="text-xs text-slate-400 mb-2">Add Clip</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={addText}>+ Text</button>
          <button className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={addImage}>+ Image</button>
          <button className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={addAudio}>+ Audio</button>
          <button className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={addRect}>+ Rect</button>
          <button className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={addCircle}>+ Circle</button>
          <button className="px-2 py-1 rounded border border-slate-700 hover:bg-slate-800" onClick={addTri}>+ Triangle</button>
        </div>
      </div>
    </div>
  );
}
