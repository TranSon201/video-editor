import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProject } from "../state/ProjectStore";
import { buildInVariant, buildOutVariant, slideVariants } from "../animations";
import type { Clip } from "../types";

export function PreviewCanvas(){
  const { currentSlide, time, selectedId, setSelectedId } = useProject();
  const W = 1280; const H = 720;
  const visibleClips = currentSlide.clips.filter(c => time >= c.start && time <= c.start + c.duration);

  return (
    <div className="flex flex-col">
      <div className="text-xs text-slate-400 px-2 py-1">Preview</div>
      <div className="bg-slate-900 border border-slate-800 rounded-md p-2">
        <div className="relative mx-auto bg-black rounded overflow-hidden" style={{ width: W, height: H }}>
          <AnimatePresence>
            <motion.div
              key={currentSlide.id}
              className="absolute inset-0"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={slideVariants[currentSlide.transition.in] || slideVariants.fade}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {currentSlide.bgColor && <div className="absolute inset-0" style={{ backgroundColor: currentSlide.bgColor }} />}
              {currentSlide.bgImage && <img src={currentSlide.bgImage} className="absolute inset-0 w-full h-full object-cover" />}
            </motion.div>
          </AnimatePresence>

          {visibleClips.slice().sort((a,b)=>a.layer-b.layer).map((clip) => (
            <ClipView key={clip.id} clip={clip} selected={selectedId===clip.id} onSelect={() => setSelectedId(clip.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ClipView({ clip, selected, onSelect }:{ clip: Clip; selected: boolean; onSelect: ()=>void }){
  const W = 1280; const H = 720;
  const x = (clip.x ?? 50) * 0.01 * W;
  const y = (clip.y ?? 50) * 0.01 * H;
  const w = (clip.w ?? 40) * 0.01 * W;
  const h = (clip.h ?? 20) * 0.01 * H;
  const inV = buildInVariant(clip.inAnim || "none");
  const outV = buildOutVariant(clip.outAnim || "none");

  return (
    <motion.div
      className={`absolute select-none ${selected ? "ring-2 ring-sky-400" : ""}`}
      style={{ left: x - w/2, top: y - h/2, width: w, height: h, rotate: clip.rotation || 0, opacity: clip.opacity ?? 1 }}
      initial={inV.initial}
      animate={inV.animate}
      exit={outV.exit}
      transition={{ duration: clip.inDur || 0.5, ease: "easeOut" }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {clip.type === "text" && (
        <div
          className="w-full h-full flex items-center justify-center text-white text-center"
          style={{ fontSize: clip.text?.fontSize || 48, color: clip.text?.color || "#fff", fontWeight: clip.text?.fontWeight || 700, textAlign: clip.text?.align || "center" }}
        >
          {clip.text?.content || "Text"}
        </div>
      )}
      {clip.type === "image" && (<img src={clip.image?.src || ""} className="w-full h-full object-cover" />)}
      {clip.type === "shape" && (
        <div className="w-full h-full">
          {clip.shape?.kind === "circle" ? (
            <div style={{ width: "100%", height: "100%", borderRadius: "9999px", background: clip.shape?.fill || "#22c55e", border: clip.shape?.stroke ? `2px solid ${clip.shape?.stroke}` : undefined }} />
          ) : clip.shape?.kind === "triangle" ? (
            <div style={{ width: 0, height: 0, borderLeft: `${w/2}px solid transparent`, borderRight: `${w/2}px solid transparent`, borderBottom: `${h}px solid ${clip.shape?.fill || "#22c55e"}` }} />
          ) : (
            <div style={{ width: "100%", height: "100%", borderRadius: clip.shape?.radius || 0, background: clip.shape?.fill || "#22c55e", border: clip.shape?.stroke ? `2px solid ${clip.shape?.stroke}` : undefined }} />
          )}
        </div>
      )}
    </motion.div>
  );
}
