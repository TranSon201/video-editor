import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Mini Timeline Editor v3 (final)
 * - Entities: text, image, shape, audio (video removed as requested)
 * - Per-entity timeline actions (appear, move, highlight) with add/remove
 * - Drag to move, 4-corner resize; Shift to lock axis; arrow keys nudge (Shift=5%)
 * - Global playback speed (0.25x–3x); audio playbackRate follows
 * - Slides with transitions + BG color/image; drag to reorder
 * - Export/Import JSON; autosave (mte_autosave_v3)
 */

type EntityType = "text" | "image" | "audio" | "shape";
type Easing = "linear" | "easeIn" | "easeOut" | "easeInOut" | "circIn" | "circOut" | "circInOut";
type AnimationName =
  | "none" | "fadeIn" | "fadeOut" | "slideInLeft" | "slideInRight" | "slideInTop" | "slideInBottom"
  | "scaleIn" | "scaleOut" | "rotateIn" | "rotateOut" | "blurIn" | "bounceIn" | "zoomIn" | "zoomOut";
export type SlideAnimName =
  | "fade" | "moveLeft" | "moveRight" | "moveUp" | "moveDown" | "flipX" | "flipY" | "zoomIn" | "zoomOut"
  | "scaleIn" | "scaleOut" | "rotateIn" | "rotateOut" | "skewLeft" | "skewRight" | "kenBurns" | "drape" | "wipe" | "split";

export type ActionType = "appear" | "move" | "highlight";
export type Action = {
  id: string; type: ActionType; start: number; end: number; easing?: Easing;
  fromX?: number; fromY?: number; toX?: number; toY?: number; intensity?: number;
};

export type Clip = {
  id: string; type: EntityType; start: number; duration: number; layer: number; name?: string;
  inAnim?: AnimationName; outAnim?: AnimationName; inDur?: number; outDur?: number; easing?: Easing;
  x?: number; y?: number; w?: number; h?: number; rotation?: number; opacity?: number;
  text?: { content: string; fontSize?: number; color?: string; align?: "left" | "center" | "right"; fontWeight?: number };
  image?: { src: string; objectFit?: "contain" | "cover" };
  audio?: { src: string; volume?: number };
  shape?: { kind: "rect" | "circle" | "triangle"; fill?: string; stroke?: string; strokeWidth?: number; radius?: number };
  actions?: Action[];
};
export type SlideTransition = { in: SlideAnimName; out: SlideAnimName };
export type Slide = { id: string; name: string; enabled?: boolean; duration: number; transition: SlideTransition; bgColor?: string; bgImage?: string; bgFit?: "contain" | "cover"; clips: Clip[]; };
export type Project = { fps: number; width: number; height: number; slides: Slide[]; };

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const fmtTime = (sec: number) => { sec = Math.max(0, sec); const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60); const s = Math.floor(sec % 60); return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`; };
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const isHex = (s: string) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s.trim());
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const defaultProject = (): Project => ({
  fps: 30, width: 1920, height: 1080,
  slides: [{
    id: "s1", name: "Slide 1", enabled: true, duration: 10, bgColor: "#000000",
    transition: { in: "fade", out: "fade" },
    clips: [
      { id: "t1", type: "text", name: "Title", start: 0, duration: 4, layer: 100, inAnim: "fadeIn", outAnim: "fadeOut", inDur: 0.6, outDur: 0.6, easing: "easeOut", x: 50, y: 25, w: 60, h: 20, opacity: 1, text: { content: "Mini Timeline Editor", fontSize: 64, color: "#ffffff", align: "center", fontWeight: 800 }, actions: [{ id: "a1", type: "appear", start: 0, end: 1 }, { id: "a2", type: "highlight", start: 1.5, end: 3.0, intensity: 0.15 }] },
      { id: "img1", type: "image", name: "Cover", start: 0.5, duration: 8, layer: 90, inAnim: "slideInRight", outAnim: "fadeOut", inDur: 0.8, outDur: 0.4, easing: "easeOut", x: 50, y: 60, w: 45, h: 45, image: { src: "https://images.unsplash.com/photo-1522199710521-72d69614c702?q=80&w=1920", objectFit: "cover" }, actions: [{ id: "m1", type: "move", start: 5, end: 7, fromX: 50, fromY: 60, toX: 80, toY: 60 }] },
      { id: "shape1", type: "shape", name: "Circle", start: 0, duration: 8, layer: 95, x: 20, y: 75, w: 12, h: 12, shape: { kind: "circle", fill: "#0ea5e9", stroke: "#ffffff88", strokeWidth: 2 }, actions: [{ id: "sapp", type: "appear", start: 0.2, end: 0.8 }, { id: "shl", type: "highlight", start: 2, end: 3.5, intensity: 0.2 }] },
      { id: "a1", type: "audio", name: "BGM", start: 0, duration: 10, layer: 1, audio: { src: "https://custom.emhoctoan.com/tuto/test.mp3", volume: 0.7 } },
    ]
  }, {
    id: "s2", name: "Slide 2", enabled: true, duration: 6, bgColor: "#111827", transition: { in: "wipe", out: "split" },
    clips: [{ id: "t2", type: "text", name: "Next slide", start: 0, duration: 4, layer: 100, x: 50, y: 50, inAnim: "slideInTop", outAnim: "fadeOut", inDur: 0.6, outDur: 0.4, text: { content: "Slide 2", fontSize: 72, color: "#fff", align: "center", fontWeight: 800 }, actions: [{ id: "a3", type: "appear", start: 0, end: 0.8 }] }]
  }]
});

function buildInVariant(name: AnimationName) { switch (name) { case "fadeIn": return { initial: { opacity: 0 }, animate: { opacity: 1 } }; case "slideInLeft": return { initial: { x: -80, opacity: 0 }, animate: { x: 0, opacity: 1 } }; case "slideInRight": return { initial: { x: 80, opacity: 0 }, animate: { x: 0, opacity: 1 } }; case "slideInTop": return { initial: { y: -60, opacity: 0 }, animate: { y: 0, opacity: 1 } }; case "slideInBottom": return { initial: { y: 60, opacity: 0 }, animate: { y: 0, opacity: 1 } }; case "scaleIn": case "zoomIn": return { initial: { scale: 0.85, opacity: 0 }, animate: { scale: 1, opacity: 1 } }; case "scaleOut": case "zoomOut": return { initial: { scale: 1.1, opacity: 0 }, animate: { scale: 1, opacity: 1 } }; case "rotateIn": return { initial: { rotate: -15, opacity: 0 }, animate: { rotate: 0, opacity: 1 } }; case "rotateOut": return { initial: { rotate: 15, opacity: 0 }, animate: { rotate: 0, opacity: 1 } }; case "blurIn": return { initial: { filter: "blur(8px)", opacity: 0 }, animate: { filter: "blur(0px)", opacity: 1 } } as any; case "bounceIn": return { initial: { scale: 0.6, opacity: 0 }, animate: { scale: [0.6, 1.05, 0.98, 1], opacity: 1 } } as any; default: return { initial: {}, animate: {} } } }
function buildOutVariant(name: AnimationName) { switch (name) { case "fadeOut": return { exit: { opacity: 0 } }; case "slideInLeft": return { exit: { x: -60, opacity: 0 } }; case "slideInRight": return { exit: { x: 60, opacity: 0 } }; case "slideInTop": return { exit: { y: -50, opacity: 0 } }; case "slideInBottom": return { exit: { y: 50, opacity: 0 } }; case "scaleIn": case "zoomIn": return { exit: { scale: 0.9, opacity: 0 } }; case "scaleOut": case "zoomOut": return { exit: { scale: 1.1, opacity: 0 } }; case "rotateIn": return { exit: { rotate: -10, opacity: 0 } }; case "rotateOut": return { exit: { rotate: 10, opacity: 0 } }; case "blurIn": return { exit: { filter: "blur(6px)", opacity: 0 } } as any; case "bounceIn": return { exit: { scale: 0.9, opacity: 0 } }; default: return { exit: {} } } }
const slideVariants: Record<SlideAnimName, any> = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  moveLeft: { initial: { x: 80, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -80, opacity: 0 } },
  moveRight: { initial: { x: -80, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: 80, opacity: 0 } },
  moveUp: { initial: { y: 80, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: -80, opacity: 0 } },
  moveDown: { initial: { y: -80, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 80, opacity: 0 } },
  flipX: { initial: { rotateX: -90, opacity: 0 }, animate: { rotateX: 0, opacity: 1 }, exit: { rotateX: 90, opacity: 0 } },
  flipY: { initial: { rotateY: -90, opacity: 0 }, animate: { rotateY: 0, opacity: 1 }, exit: { rotateY: 90, opacity: 0 } },
  zoomIn: { initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 1.05, opacity: 0 } },
  zoomOut: { initial: { scale: 1.05, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.9, opacity: 0 } },
  scaleIn: { initial: { scale: 0.85, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.95, opacity: 0 } },
  scaleOut: { initial: { scale: 1.15, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 1.05, opacity: 0 } },
  rotateIn: { initial: { rotate: -10, opacity: 0 }, animate: { rotate: 0, opacity: 1 }, exit: { rotate: 10, opacity: 0 } },
  rotateOut: { initial: { rotate: 10, opacity: 0 }, animate: { rotate: 0, opacity: 1 }, exit: { rotate: -10, opacity: 0 } },
  skewLeft: { initial: { skewX: -10, opacity: 0 }, animate: { skewX: 0, opacity: 1 }, exit: { skewX: 10, opacity: 0 } },
  skewRight: { initial: { skewX: 10, opacity: 0 }, animate: { skewX: 0, opacity: 1 }, exit: { skewX: -10, opacity: 0 } },
  kenBurns: { initial: { scale: 1.05, x: -10, y: -6, opacity: 0 }, animate: { scale: 1, x: 0, y: 0, opacity: 1 }, exit: { scale: 1.05, x: 10, y: 6, opacity: 0 } },
  drape: { initial: { y: -200, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 200, opacity: 0 } },
  wipe: { initial: { clipPath: "inset(0 0 0 100%)" }, animate: { clipPath: "inset(0 0 0 0%)" }, exit: { clipPath: "inset(0 100% 0 0)" } },
  split: { initial: { scaleX: 0, opacity: 0, transformOrigin: "50% 50%" }, animate: { scaleX: 1, opacity: 1 }, exit: { scaleX: 0, opacity: 0 } },
};
const easingMap: Record<Easing, any> = { linear: "linear", easeIn: [0.4, 0, 1, 1], easeOut: [0, 0, 0.2, 1], easeInOut: [0.4, 0, 0.2, 1], circIn: [0.55, 0, 1, 0.45], circOut: [0, 0.55, 0.45, 1], circInOut: [0.85, 0, 0.15, 1] };

export default function App() {
  const [project, setProject] = useState<Project>(() => { try { const raw = localStorage.getItem("mte_autosave_v3"); if (raw) return JSON.parse(raw); } catch { } return defaultProject(); });
  const [activeSlideId, setActiveSlideId] = useState(project.slides[0]?.id || "");
  const [playAcrossSlides, setPlayAcrossSlides] = useState(true);
  const [speed, setSpeed] = useState(1);
  const slide = useMemo(() => project.slides.find(s => s.id === activeSlideId) || project.slides[0], [project, activeSlideId]);
  const slideIndex = useMemo(() => project.slides.findIndex(s => s.id === slide?.id), [project, slide?.id]);
  const [time, setTime] = useState(0);
  const [isPlaying, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [dragTL, setDragTL] = useState<{ id: string; mode: "move" | "resize-left" | "resize-right"; startX: number; startY: number; initStart: number; initDur: number; initIndex: number } | null>(null);
  const rowH = 40; const scale = 40; // px / sec

  type DragCanvasState = { id: string; mode: "move" | "resize"; corner?: "nw" | "ne" | "sw" | "se"; startX: number; startY: number; init: { x: number; y: number; w?: number; h?: number; fontSize?: number }; canvasW: number; canvasH: number } | null;
  const [dragCanvas, setDragCanvas] = useState<DragCanvasState>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem("mte_autosave_v3", JSON.stringify(project)); }, [project]);

  const duration = slide?.duration || 0;
  useEffect(() => {
    if (!isPlaying) return; let raf = 0, last = performance.now();
    const loop = (t: number) => {
      const dt = ((t - last) / 1000) * Math.max(0.01, speed); last = t;
      setTime(prev => { const nxt = prev + dt; if (nxt >= duration) { if (playAcrossSlides) { const next = findNextEnabledSlide(project, slideIndex); if (next !== null && next !== slideIndex) { setActiveSlideId(project.slides[next].id); return 0; } } setPlaying(false); return duration; } return nxt; });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [isPlaying, duration, playAcrossSlides, slideIndex, project, speed]);

  useEffect(() => { setTime(0); setSelectedId(null); }, [activeSlideId]);

  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  useEffect(() => {
    const clips = slide?.clips || [];
    Object.entries(audioRefs.current).forEach(([id, el]) => {
      if (!el) return; const clip = clips.find(c => c.id === id);
      if (!clip || clip.type !== "audio") { if (!el.paused) el.pause(); return; }
      const rel = time - clip.start;
      if (rel < 0 || rel > clip.duration) { if (!el.paused) el.pause(); return; }
      el.playbackRate = Math.max(0.25, Math.min(3, speed));
      if (isPlaying) { if (Math.abs(el.currentTime - rel) > 0.2) el.currentTime = rel; if (el.paused) el.play().catch(() => { }); }
      else { el.currentTime = clamp(rel, 0, Math.max(0, clip.duration - 0.01)); if (!el.paused) el.pause(); }
      el.volume = clip.audio?.volume ?? 1;
    });
  }, [time, isPlaying, slide, speed]);

  // arrow-key nudge
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId || !slide) return; const clip = slide.clips.find(c => c.id === selectedId); if (!clip || clip.type === "audio") return;
      const step = e.shiftKey ? 5 : 1; let dx = 0, dy = 0;
      if (e.key === "ArrowLeft") dx = -step; else if (e.key === "ArrowRight") dx = step; else if (e.key === "ArrowUp") dy = -step; else if (e.key === "ArrowDown") dy = step; else return;
      e.preventDefault(); setClip(clip.id, { x: clamp((clip.x || 50) + dx, 0, 100), y: clamp((clip.y || 50) + dy, 0, 100) });
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, slide]);

  const visible = useMemo(() => { const clips = slide?.clips || []; return clips.filter(c => time >= c.start && time <= c.start + c.duration).sort((a, b) => a.layer - b.layer); }, [slide, time]);

  const setClip = (id: string, patch: Partial<Clip>) => setProject(p => ({ ...p, slides: p.slides.map(s => s.id !== slide!.id ? s : ({ ...s, clips: s.clips.map(c => c.id === id ? { ...c, ...patch } : c) })) }));

  // Shift toàn bộ actions theo delta giây; có thể clamp theo phạm vi clip mới
  const shiftActions = (acts: Action[] | undefined, delta: number, bounds?: { start: number; duration: number }) => {
    if (!acts || Math.abs(delta) < 1e-6) return acts;
    return acts.map(a => {
      const ns = a.start + delta;
      const ne = a.end + delta;
      return { ...a, start: ns, end: ne };
    });
  };

  // Đổi start và dịch actions đi kèm
  const updateClipStart = (clip: Clip, newStart: number) => {
    const delta = newStart - clip.start;
    setProject(p => ({
      ...p,
      slides: p.slides.map(s => s.id !== slide!.id ? s : ({
        ...s,
        clips: s.clips.map(c => c.id !== clip.id ? c : ({
          ...c,
          start: newStart,
          actions: shiftActions(c.actions, delta, { start: newStart, duration: c.duration })
        }))
      }))
    }));
  };

  // Đổi start + duration (resize-left): dịch & clamp actions theo phạm vi mới
  const updateClipStartAndDuration = (clip: Clip, newStart: number, newDur: number) => {
    const delta = newStart - clip.start;
    setProject(p => ({
      ...p,
      slides: p.slides.map(s => s.id !== slide!.id ? s : ({
        ...s,
        clips: s.clips.map(c => c.id !== clip.id ? c : ({
          ...c,
          start: newStart,
          duration: newDur,
          actions: shiftActions(c.actions, delta, { start: newStart, duration: newDur })
        }))
      }))
    }));
  };
  const addClip = (type: EntityType) => {
    if (!slide) return; const id = `${type}_${Math.random().toString(36).slice(2, 7)}`;
    const maxLayer = Math.max(0, ...slide.clips.map(c => c.layer));
    const base: Clip = { id, type, start: clamp(time, 0, (slide.duration || 1) - 0.5), duration: 4, layer: maxLayer + 1, x: 50, y: 50, w: 40, h: 40, opacity: 1, inAnim: "fadeIn", outAnim: "fadeOut", inDur: 0.3, outDur: 0.3, easing: "easeOut", actions: [] };
    if (type === "text") base.text = { content: "New Text", fontSize: 48, color: "#ffffff", align: "center", fontWeight: 700 };
    if (type === "image") base.image = { src: "https://picsum.photos/1920/1080", objectFit: "cover" };
    if (type === "audio") base.audio = { src: "", volume: 1 };
    if (type === "shape") base.shape = { kind: "rect", fill: "#22c55e", stroke: "#00000055", strokeWidth: 2, radius: 8 };
    setProject(p => ({ ...p, slides: p.slides.map(s => s.id === slide.id ? { ...s, clips: [...s.clips, base] } : s) })); setSelectedId(id);
  };
  const removeClip = (id: string) => setProject(p => ({ ...p, slides: p.slides.map(s => s.id !== slide!.id ? s : ({ ...s, clips: s.clips.filter(c => c.id !== id) })) }));

  const addSlide = () => { const id = `s_${Math.random().toString(36).slice(2, 7)}`; const newSlide: Slide = { id, name: `Slide ${project.slides.length + 1}`, enabled: true, duration: 8, transition: { in: "fade", out: "fade" }, bgColor: "#000000", bgFit: "cover", clips: [] }; setProject(p => ({ ...p, slides: [...p.slides, newSlide] })); setActiveSlideId(id); };
  const removeSlide = (id: string) => { const idx = project.slides.findIndex(s => s.id === id); setProject(p => ({ ...p, slides: p.slides.filter(s => s.id !== id) })); if (activeSlideId === id) { const next = Math.max(0, idx - 1); setActiveSlideId(project.slides[next]?.id || ""); } };
  const [dragSlide, setDragSlide] = useState<{ id: string; startY: number; initIndex: number } | null>(null);
  const onSlideMouseDown = (e: React.MouseEvent, id: string, index: number) => setDragSlide({ id, startY: e.clientY, initIndex: index });
  const onSlideMouseMove = (e: React.MouseEvent) => {
    if (!dragSlide) return; const dy = e.clientY - dragSlide.startY; const from = dragSlide.initIndex; let to = from + Math.round(dy / 36); to = clamp(to, 0, project.slides.length - 1);
    if (to !== from) { setProject(p => { const arr = p.slides.slice(); const idx = arr.findIndex(s => s.id === dragSlide.id); const [mv] = arr.splice(idx, 1); arr.splice(to, 0, mv); return { ...p, slides: arr }; }); setDragSlide({ ...dragSlide, startY: e.clientY, initIndex: to }); }
  };
  const onSlideMouseUp = () => setDragSlide(null);

  const onExport = () => { const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "project_v3.json"; a.click(); URL.revokeObjectURL(url); };
  const onImport = async (file: File) => { try { const text = await file.text(); const json = JSON.parse(text) as Project; if (!json?.slides) throw new Error("Invalid file"); setProject(json); setActiveSlideId(json.slides[0]?.id || ""); setTime(0); } catch (e: any) { alert(`Import failed: ${e?.message || e}`); } };

  const onMouseDownClip = (e: React.MouseEvent, clip: Clip, mode: "move" | "resize-left" | "resize-right", rowIndex: number) => { e.stopPropagation(); setSelectedId(clip.id); setDragTL({ id: clip.id, mode, startX: e.clientX, startY: e.clientY, initStart: clip.start, initDur: clip.duration, initIndex: rowIndex }); };
  const onMouseMoveTL = (e: React.MouseEvent) => {
    if (!dragTL || !slide) return; const clip = slide.clips.find(c => c.id === dragTL.id); if (!clip) return;
    const dx = e.clientX - dragTL.startX; const dSec = dx / scale;
    if (dragTL.mode === "move") {
      const newStart = clamp(dragTL.initStart + dSec, 0, (slide.duration || 0) - clip.duration);
      updateClipStart(clip, newStart);
    } else if (dragTL.mode === "resize-left") {
      const newStart = clamp(dragTL.initStart + dSec, 0, clip.start + clip.duration - 0.2);
      const newDur = clamp(dragTL.initDur - dSec, 0.2, (slide.duration || 0) - newStart);
      updateClipStartAndDuration(clip, newStart, newDur);
    } else if (dragTL.mode === "resize-right") { const newDur = clamp(dragTL.initDur + dSec, 0.2, (slide.duration || 0) - clip.start); setClip(clip.id, { duration: newDur }); }
    const dy = e.clientY - dragTL.startY; let toIndex = dragTL.initIndex + Math.round(dy / rowH); toIndex = clamp(toIndex, 0, slide.clips.length - 1);
    if (toIndex !== dragTL.initIndex) { setProject(p => { const sIdx = p.slides.findIndex(s => s.id === slide.id); const s = p.slides[sIdx]; const arr = s.clips.slice(); const from = arr.findIndex(c => c.id === dragTL.id); const [mv] = arr.splice(from, 1); arr.splice(toIndex, 0, mv); const base = 1000; arr.forEach((c, i) => { c.layer = base - i; }); const newSlides = p.slides.slice(); newSlides[sIdx] = { ...s, clips: arr }; return { ...p, slides: newSlides }; }); setDragTL({ ...dragTL, startY: e.clientY, initIndex: toIndex }); }
  };
  const onMouseUpTL = () => setDragTL(null);

  const rulerRef = useRef<HTMLDivElement>(null);
  const onRulerClick = (e: React.MouseEvent) => { if (!rulerRef.current) return; const rect = rulerRef.current.getBoundingClientRect(); const x = e.clientX - rect.left - 160; const t = clamp(x / scale, 0, duration); setTime(t); };

  const startCanvasMove = (e: React.MouseEvent, clip: Clip) => {
    if (clip.type === "audio") return; e.stopPropagation(); setSelectedId(clip.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    setDragCanvas({ id: clip.id, mode: "move", startX: e.clientX, startY: e.clientY, init: { x: clip.x || 50, y: clip.y || 50, w: clip.w, h: clip.h, fontSize: clip.text?.fontSize }, canvasW: rect?.width || 960, canvasH: rect?.height || 540 });
  };
  const startCanvasResize = (e: React.MouseEvent, clip: Clip, corner: "nw" | "ne" | "sw" | "se") => {
    if (clip.type === "audio") return; e.stopPropagation(); setSelectedId(clip.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    setDragCanvas({ id: clip.id, mode: "resize", corner, startX: e.clientX, startY: e.clientY, init: { x: clip.x || 50, y: clip.y || 50, w: clip.w, h: clip.h, fontSize: clip.text?.fontSize }, canvasW: rect?.width || 960, canvasH: rect?.height || 540 });
  };
  const onCanvasMouseMove = (e: React.MouseEvent) => {
    if (!dragCanvas || !slide) return; const clip = slide.clips.find(c => c.id === dragCanvas.id); if (!clip) return;
    const dx = e.clientX - dragCanvas.startX; const dy = e.clientY - dragCanvas.startY; const pxW = dragCanvas.canvasW || 960; const pxH = dragCanvas.canvasH || 540; const dPctX = (dx / pxW) * 100; const dPctY = (dy / pxH) * 100;
    if (dragCanvas.mode === "move") {
      const lockX = e.shiftKey && Math.abs(dx) > Math.abs(dy); const lockY = e.shiftKey && Math.abs(dy) > Math.abs(dx);
      const nx = clamp((dragCanvas.init.x || 50) + (lockY ? 0 : dPctX), 0, 100); const ny = clamp((dragCanvas.init.y || 50) + (lockX ? 0 : dPctY), 0, 100); setClip(clip.id, { x: nx, y: ny });
    } else {
      const corner = dragCanvas.corner!; const addW = (corner === "ne" || corner === "se") ? dPctX : -dPctX; const addH = (corner === "sw" || corner === "se") ? dPctY : -dPctY; const nw = clamp((dragCanvas.init.w || 40) + addW, 2, 100); const nh = clamp((dragCanvas.init.h || 40) + addH, 2, 100);
      const patch: Partial<Clip> = { w: nw, h: nh }; if (clip.type === "text") { patch.text = { ...(clip.text || {}), fontSize: Math.max(10, (dragCanvas.init.fontSize || 48) + dy / 3 * (corner === "sw" || corner === "se" ? 1 : -1)) }; } setClip(clip.id, patch);
    }
  };
  const onCanvasMouseUp = () => setDragCanvas(null);

  const selected = slide?.clips.find(c => c.id === selectedId) || null;
  const slideTrans = slideVariants[slide?.transition.in || "fade"] || slideVariants.fade;
  function findNextEnabledSlide(p: Project, fromIndex: number) { for (let i = fromIndex + 1; i < p.slides.length; i++) { if (p.slides[i].enabled !== false) return i; } return null; }
  function evalActions(clip: Clip, t: number) {
    let x = clip.x ?? 50, y = clip.y ?? 50, opacity = clip.opacity ?? 1, scaleMul = 1; for (const a of (clip.actions || [])) {
      if (t < a.start || t > a.end) continue; const dur = Math.max(0.001, a.end - a.start); const p = clamp((t - a.start) / dur, 0, 1);
      if (a.type === "appear") { opacity = opacity * p; } else if (a.type === "move") { const fx = a.fromX ?? x, tx = a.toX ?? x, fy = a.fromY ?? y, ty = a.toY ?? y; x = lerp(fx, tx, p); y = lerp(fy, ty, p); } else if (a.type === "highlight") { const k = a.intensity ?? 0.15; const pulse = Math.sin(p * Math.PI); scaleMul *= 1 + k * pulse; }
    } return { x, y, opacity, scaleMul };
  }

  const projectW = 960, projectH = (960 * 9) / 16;

  return (<div className="h-screen w-full flex flex-col bg-slate-950 text-slate-100 select-none" onMouseMove={onSlideMouseMove} onMouseUp={onSlideMouseUp}>
    <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800">
      <div className="font-semibold">Mini Timeline Editor v3</div>
      <div className="ml-6 flex items-center gap-2">
        <button className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700" onClick={() => setPlaying(true)}>Play</button>
        <button className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700" onClick={() => setPlaying(false)}>Pause</button>
        <button className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700" onClick={() => { setPlaying(false); setTime(0); }}>Stop</button>
        <label className="ml-4 text-sm flex items-center gap-2"><input type="checkbox" checked={playAcrossSlides} onChange={(e) => setPlayAcrossSlides(e.target.checked)} />Play across slides</label>
        <div className="flex items-center gap-2 ml-4 text-sm"><span>Speed</span><input type="range" min={0.25} max={3} step={0.05} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} /><span className="tabular-nums">{speed.toFixed(2)}×</span></div>
        <div className="px-2 text-sm tabular-nums">{fmtTime(time)} / {fmtTime(duration)} (Slide {slideIndex + 1}/{project.slides.length})</div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700" onClick={onExport}>Export JSON</button>
        <label className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer">Import JSON
          <input type="file" className="hidden" accept="application/json" onChange={(e) => e.target.files && onImport(e.target.files[0])} />
        </label>
      </div>
    </div>

    <div className="flex-1 grid grid-cols-[300px_1fr_360px] overflow-hidden">
      {/* Left */}
      <div className="border-r border-slate-800 p-3 space-y-4 overflow-auto">
        <div>
          <div className="text-xs uppercase text-slate-400 mb-2">Slides (drag to reorder)</div>
          <div>{project.slides.map((s, i) => (
            <div key={s.id} className={`px-2 py-2 rounded mb-1 flex items-center gap-2 text-sm ${s.id === slide.id ? "bg-slate-700" : "bg-slate-800 hover:bg-slate-700"}`}
              onClick={() => setActiveSlideId(s.id)} onMouseDown={(e) => onSlideMouseDown(e, s.id, i)}>
              <span className="cursor-grab">☰</span>
              <input className="flex-1 bg-slate-900 px-2 py-1 rounded" value={s.name} onChange={(e) => setProject(p => ({ ...p, slides: p.slides.map(x => x.id === s.id ? { ...x, name: e.target.value } : x) }))} />
              <button className="text-red-300 hover:text-red-200" onClick={(e) => { e.stopPropagation(); removeSlide(s.id); }}>✕</button>
            </div>
          ))}
            <button className="mt-2 w-full px-2 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={addSlide}>+ Add Slide</button></div>
        </div>

        <div>
          <div className="text-xs uppercase text-slate-400 mb-2">Add Clip</div>
          <div className="grid grid-cols-2 gap-2">
            <button className="px-2 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={() => addClip("text")}>Text</button>
            <button className="px-2 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={() => addClip("image")}>Image</button>
            <button className="px-2 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={() => addClip("shape")}>Shape</button>
            <button className="px-2 py-2 rounded bg-slate-800 hover:bg-slate-700" onClick={() => addClip("audio")}>Audio</button>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase text-slate-400 mb-2">Slide Settings</div>
          <label className="flex items-center justify-between text-sm mb-2">Duration (s)
            <input type="number" className="w-28 bg-slate-900 px-2 py-1 rounded" min={1} value={slide.duration}
              onChange={(e) => setProject(p => ({ ...p, slides: p.slides.map(s => s.id === slide.id ? { ...s, duration: Math.max(1, Number(e.target.value || 1)) } : s) }))} />
          </label>
          <div className="grid grid-cols-2 gap-2 items-center">
            <label className="text-sm">In</label>
            <select className="bg-slate-900 px-2 py-1 rounded" value={slide.transition.in}
              onChange={(e) => setProject(p => ({ ...p, slides: p.slides.map(s => s.id === slide.id ? { ...s, transition: { ...s.transition, in: e.target.value as SlideAnimName } } : s) }))}>
              {Object.keys(slideVariants).map(k => (<option key={k} value={k}>{k}</option>))}
            </select>
            <label className="text-sm">Out</label>
            <select className="bg-slate-900 px-2 py-1 rounded" value={slide.transition.out}
              onChange={(e) => setProject(p => ({ ...p, slides: p.slides.map(s => s.id === slide.id ? { ...s, transition: { ...s.transition, out: e.target.value as SlideAnimName } } : s) }))}>
              {Object.keys(slideVariants).map(k => (<option key={k} value={k}>{k}</option>))}
            </select>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 items-center">
            <label className="text-sm">BG Color</label>
            <div className="flex items-center gap-2 col-span-1">
              <input type="color" className="bg-slate-900 rounded w-10 h-8" value={slide.bgColor || "#000000"} onChange={(e) => setProject(p => ({ ...p, slides: p.slides.map(s => s.id === slide.id ? { ...s, bgColor: e.target.value } : s) }))} />
              <input className="bg-slate-900 px-2 py-1 rounded w-28" placeholder="#000000" value={slide.bgColor || ""}
                onChange={(e) => { const v = e.target.value; if (isHex(v) || v === "") setProject(p => ({ ...p, slides: p.slides.map(s => s.id === slide.id ? { ...s, bgColor: v } : s) })); }} />
            </div>
            <label className="text-sm">BG Image</label>
            <input className="bg-slate-900 px-2 py-1 rounded col-span-1" placeholder="https://..." value={slide.bgImage || ""}
              onChange={(e) => setProject(p => ({ ...p, slides: p.slides.map(s => s.id === slide.id ? { ...s, bgImage: e.target.value } : s) }))} />
            <label className="text-sm">Fit</label>
            <select className="bg-slate-900 px-2 py-1 rounded" value={slide.bgFit || "cover"}
              onChange={(e) => setProject(p => ({ ...p, slides: p.slides.map(s => s.id === slide.id ? { ...s, bgFit: e.target.value as any } : s) }))}>
              <option value="cover">cover</option>
              <option value="contain">contain</option>
            </select>
          </div>
        </div>
      </div>

      {/* Center */}
      <div className="flex flex-col overflow-hidden" onMouseMove={onMouseMoveTL} onMouseUp={onMouseUpTL}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-center bg-slate-900"
          onMouseMove={onCanvasMouseMove} onMouseUp={onCanvasMouseUp}>
          <motion.div ref={canvasRef} className="relative overflow-hidden rounded-xl shadow-xl"
            style={{ width: projectW, height: projectH, background: slide.bgColor || "#000" }}
            {...(slideTrans)} transition={{ duration: 0.6, ease: "easeOut" }} key={slide.id + ":" + activeSlideId}>
            {slide.bgImage && (<img src={slide.bgImage} alt="bg" className="absolute inset-0 w-full h-full" style={{ objectFit: slide.bgFit || "cover", pointerEvents: "none" }} draggable={false} />)}
            <AnimatePresence>
              {visible.map(clip => {
                const sel = selectedId === clip.id; const inVar = buildInVariant(clip.inAnim || "none"); const outVar = buildOutVariant(clip.outAnim || "none");
                const trans = { duration: clip.inDur || 0.3, ease: easingMap[clip.easing || "easeOut"] };
                const pxW = ((clip.w || 40) / 100) * projectW; const pxH = ((clip.h || 40) / 100) * projectH;
                const act = evalActions(clip, time);
                const baseStyle: React.CSSProperties = { position: "absolute", left: `${act.x}%`, top: `${act.y}%`, transform: `translate(-50%,-50%) rotate(${clip.rotation || 0}deg) scale(${act.scaleMul})`, opacity: act.opacity };
                const Handle = ({ corner }: { corner: "nw" | "ne" | "sw" | "se" }) => (<div onMouseDown={(e) => startCanvasResize(e, clip, corner)} className="absolute w-3.5 h-3.5 rounded-full bg-white shadow"
                  style={{ left: corner.includes("w") ? -6 : pxW - 6, top: corner.includes("n") ? -6 : pxH - 6, cursor: `${corner}-resize` as any }} />);
                const hasHi = (clip.actions || []).some(a => a.type === "highlight" && time >= a.start && time <= a.end);

                if (clip.type === "text") {
                  const t = clip.text!;
                  return (<motion.div key={clip.id} {...inVar} {...outVar} transition={trans} style={baseStyle}>
                    <div className={`relative px-2 ${sel ? "ring-2 ring-sky-400" : hasHi ? "ring-2 ring-amber-400" : ""}`}
                      style={{ width: pxW, height: pxH, display: "flex", alignItems: "center", justifyContent: "center", cursor: "move" }}
                      onMouseDown={(e) => startCanvasMove(e, clip)}>
                      <div style={{ fontSize: (t.fontSize || 48) + "px", color: t.color || "#fff", fontWeight: t.fontWeight || 600, textAlign: t.align || "center", lineHeight: 1.15, whiteSpace: "pre-wrap", userSelect: "none", pointerEvents: "none" }}>{t.content}</div>
                      {sel && (<><Handle corner="nw" /><Handle corner="ne" /><Handle corner="sw" /><Handle corner="se" /></>)}
                    </div>
                  </motion.div>);
                }
                if (clip.type === "image") {
                  const im = clip.image!;
                  return (<motion.div key={clip.id} {...inVar} {...outVar} transition={trans} style={baseStyle}>
                    <div className={`relative ${sel ? "ring-2 ring-sky-400" : hasHi ? "ring-2 ring-amber-400" : ""}`} style={{ width: pxW, height: pxH, cursor: "move" }} onMouseDown={(e) => startCanvasMove(e, clip)}>
                      <img src={im.src} alt={clip.name || clip.id} className="w-full h-full rounded-md shadow-md" style={{ objectFit: im.objectFit || "contain", pointerEvents: "none", userSelect: "none" }} draggable={false} />
                      {sel && (<><Handle corner="nw" /><Handle corner="ne" /><Handle corner="sw" /><Handle corner="se" /></>)}
                    </div>
                  </motion.div>);
                }
                if (clip.type === "shape") {
                  const sh = clip.shape!; let content: React.ReactNode = null;
                  if (sh.kind === "triangle") { content = <div style={{ width: 0, height: 0, borderLeft: `${pxW / 2}px solid transparent`, borderRight: `${pxW / 2}px solid transparent`, borderBottom: `${pxH}px solid ${sh.fill || "#ef4444"}` }} />; }
                  else if (sh.kind === "circle") { content = <div style={{ width: pxW, height: pxH, background: sh.fill || "#22c55e", borderRadius: "50%", border: sh.stroke ? `${sh.strokeWidth || 2}px solid ${sh.stroke}` : undefined }} />; }
                  else { content = <div style={{ width: pxW, height: pxH, background: sh.fill || "#22c55e", borderRadius: (sh.radius || 0) + "px", border: sh.stroke ? `${sh.strokeWidth || 2}px solid ${sh.stroke}` : undefined }} />; }
                  return (<motion.div key={clip.id} {...inVar} {...outVar} transition={trans} style={baseStyle}>
                    <div className={`relative ${sel ? "ring-2 ring-sky-400" : hasHi ? "ring-2 ring-amber-400" : ""}`} onMouseDown={(e) => startCanvasMove(e, clip)} style={{ cursor: "move" }}>
                      {content}
                      {sel && (<><Handle corner="nw" /><Handle corner="ne" /><Handle corner="sw" /><Handle corner="se" /></>)}
                    </div>
                  </motion.div>);
                }
                if (clip.type === "audio") { const a = clip.audio!; return <audio key={clip.id} ref={(el) => (audioRefs.current[clip.id] = el)} src={a.src} preload="auto" />; }
                return null;
              })}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Timeline */}
        <div className="flex-1 grid grid-rows-[32px_1fr]">
          <div className="relative bg-slate-900 border-b border-slate-800" onClick={onRulerClick} ref={rulerRef}>
            <div className="absolute left-0 top-0 bottom-0 w-40 flex items-center justify-center text-xs text-slate-400">Timeline</div>
            <div className="ml-40 h-full relative">
              {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                <div key={i} className="absolute top-0 h-full border-l border-slate-800 text-[10px] text-slate-400" style={{ left: i * scale }}>
                  <div className="-translate-x-1/2 px-1">{fmtTime(i)}</div>
                </div>
              ))}
              <div className="absolute top-0 bottom-0 w-px bg-rose-400" style={{ left: time * scale }} />
            </div>
          </div>
          <div className="relative bg-slate-950 overflow-auto" onMouseDown={() => setSelectedId(null)}>
            <div className="absolute left-0 top-0 bottom-0 w-40 border-r border-slate-800 text-xs text-slate-400">
              {slide.clips.map(c => (<div key={c.id} className="h-10 flex items-center justify-center border-b border-slate-800 truncate" title={c.type}>{c.type}</div>))}
            </div>
            <div className="ml-40 relative" style={{ height: rowH * Math.max(1, slide.clips.length) }}>
              {slide.clips.map((c, idx) => {
                const left = c.start * scale, width = Math.max(4, c.duration * scale), selected = selectedId === c.id;
                return (<div key={c.id} className="h-10 border-b border-slate-900/60 relative">
                  <div className={`absolute top-1 h-6 rounded-md ${selected ? "bg-sky-500" : "bg-slate-700 hover:bg-slate-600"} cursor-grab active:cursor-grabbing`} style={{ left, width }}
                    onMouseDown={(e) => onMouseDownClip(e, c, "move", idx)} onClick={(e) => { e.stopPropagation(); setSelectedId(c.id); }}
                    title={`${c.name || c.id} (${fmtTime(c.start)} - ${fmtTime(c.start + c.duration)})`}>
                    <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/10 rounded-l" onMouseDown={(e) => onMouseDownClip(e, c, "resize-left", idx)} />
                    <div className="px-2 text-[10px] truncate leading-6">{c.name || c.id}</div>
                    <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/10 rounded-r" onMouseDown={(e) => onMouseDownClip(e, c, "resize-right", idx)} />
                  </div>
                  <div className="absolute left-0 right-0 top-7 h-2">
                    {(c.actions || []).map(a => {
                      const aLeft = a.start * scale, aWidth = Math.max(2, (a.end - a.start) * scale);
                      const color = a.type === "appear" ? "bg-emerald-400" : a.type === "move" ? "bg-indigo-400" : "bg-amber-400";
                      return <div key={a.id} className={`absolute h-2 rounded ${color}`} style={{ left: aLeft, width: aWidth }} title={`${a.type} ${fmtTime(a.start)}-${fmtTime(a.end)}`} />;
                    })}
                  </div>
                </div>);
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="border-l border-slate-800 p-3 overflow-auto">
        <div className="text-xs uppercase text-slate-400 mb-2">Inspector</div>
        {!selected ? (<div className="text-slate-400 text-sm">Chọn một clip để chỉnh. Kéo trên preview để di chuyển; 4 chấm góc để resize; phím mũi tên để nudge (Shift=5%).</div>) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-sm">Name</label><input className="bg-slate-900 px-2 py-1 rounded" value={selected.name || ""} onChange={(e) => setClip(selected.id, { name: e.target.value })} />
              <label className="text-sm">Type</label><div className="text-xs text-slate-400">{selected.type}</div>
              <label className="text-sm">Start</label><input type="number" className="bg-slate-900 px-2 py-1 rounded" value={selected.start} min={0} max={duration} onChange={(e) => setClip(selected.id, { start: clamp(Number(e.target.value || 0), 0, duration) })} />
              <label className="text-sm">Duration</label><input type="number" className="bg-slate-900 px-2 py-1 rounded" value={selected.duration} min={0.2} onChange={(e) => setClip(selected.id, { duration: Math.max(0.2, Number(e.target.value || 0.2)) })} />
              <label className="text-sm">Layer</label><input type="number" className="bg-slate-900 px-2 py-1 rounded" value={selected.layer} onChange={(e) => setClip(selected.id, { layer: Number(e.target.value || 0) })} />
              {selected.type !== "audio" && (<>
                <label className="text-sm">X (%)</label><input type="number" className="bg-slate-900 px-2 py-1 rounded" value={selected.x || 50} onChange={(e) => setClip(selected.id, { x: clamp(Number(e.target.value || 0), 0, 100) })} />
                <label className="text-sm">Y (%)</label><input type="number" className="bg-slate-900 px-2 py-1 rounded" value={selected.y || 50} onChange={(e) => setClip(selected.id, { y: clamp(Number(e.target.value || 0), 0, 100) })} />
                <label className="text-sm">Rotation</label><input type="number" className="bg-slate-900 px-2 py-1 rounded" value={selected.rotation || 0} onChange={(e) => setClip(selected.id, { rotation: Number(e.target.value || 0) })} />
                <label className="text-sm">Opacity</label><input type="number" step={0.05} className="bg-slate-900 px-2 py-1 rounded" value={selected.opacity ?? 1} onChange={(e) => setClip(selected.id, { opacity: clamp(Number(e.target.value || 0), 0, 1) })} />
              </>)}
              {selected.type !== "text" && selected.type !== "audio" && (<>
                <label className="text-sm">Width (%)</label><input type="number" className="bg-slate-900 px-2 py-1 rounded" value={selected.w || 40} onChange={(e) => setClip(selected.id, { w: clamp(Number(e.target.value || 0), 2, 100) })} />
                <label className="text-sm">Height (%)</label><input type="number" className="bg-slate-900 px-2 py-1 rounded" value={selected.h || 40} onChange={(e) => setClip(selected.id, { h: clamp(Number(e.target.value || 0), 2, 100) })} />
              </>)}
            </div>

            {selected.type === "text" && (<div className="space-y-2">
              <div className="text-xs uppercase text-slate-400">Text</div>
              <textarea className="w-full h-24 bg-slate-900 rounded p-2" value={selected.text?.content || ""} onChange={(e) => setClip(selected.id, { text: { ...(selected.text || {}), content: e.target.value } })} />
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-sm">Font Size</label><input type="number" className="bg-slate-900 px-2 py-1 rounded" value={selected.text?.fontSize || 48} onChange={(e) => setClip(selected.id, { text: { ...(selected.text || {}), fontSize: Number(e.target.value || 0) } })} />
                <label className="text-sm">Weight</label><input type="number" className="bg-slate-900 px-2 py-1 rounded" value={selected.text?.fontWeight || 700} onChange={(e) => setClip(selected.id, { text: { ...(selected.text || {}), fontWeight: Number(e.target.value || 400) } })} />
                <label className="text-sm">Color</label><input className="bg-slate-900 px-2 py-1 rounded" value={selected.text?.color || ""} onChange={(e) => setClip(selected.id, { text: { ...(selected.text || {}), color: e.target.value } })} placeholder="#ffffff" />
                <label className="text-sm">Align</label><select className="bg-slate-900 px-2 py-1 rounded" value={selected.text?.align || "center"} onChange={(e) => setClip(selected.id, { text: { ...(selected.text || {}), align: e.target.value as any } })}>
                  <option value="left">left</option><option value="center">center</option><option value="right">right</option>
                </select>
              </div>
            </div>)}

            {selected.type === "image" && (<div className="space-y-2">
              <div className="text-xs uppercase text-slate-400">Image</div>
              <input className="w-full bg-slate-900 rounded p-2" placeholder="Image URL" value={selected.image?.src || ""} onChange={(e) => setClip(selected.id, { image: { ...(selected.image || { objectFit: "contain" }), src: e.target.value } })} />
              <label className="text-sm">Object Fit</label>
              <select className="bg-slate-900 px-2 py-1 rounded" value={selected.image?.objectFit || "contain"} onChange={(e) => setClip(selected.id, { image: { ...(selected.image || {}), objectFit: e.target.value as any } })}>
                <option value="contain">contain</option><option value="cover">cover</option>
              </select>
            </div>)}

            {selected.type === "shape" && (<div className="space-y-2">
              <div className="text-xs uppercase text-slate-400">Shape</div>
              <div className="grid grid-cols-2 gap-2 items-center">
                <label className="text-sm">Kind</label><select className="bg-slate-900 px-2 py-1 rounded" value={selected.shape?.kind || "rect"} onChange={(e) => setClip(selected.id, { shape: { ...(selected.shape || {}), kind: e.target.value as any } })}>
                  <option value="rect">rect</option><option value="circle">circle</option><option value="triangle">triangle</option>
                </select>
                <label className="text-sm">Fill</label><input className="bg-slate-900 px-2 py-1 rounded" value={selected.shape?.fill || ""} onChange={(e) => setClip(selected.id, { shape: { ...(selected.shape || {}), fill: e.target.value } })} placeholder="#22c55e" />
                <label className="text-sm">Stroke</label><input className="bg-slate-900 px-2 py-1 rounded" value={selected.shape?.stroke || ""} onChange={(e) => setClip(selected.id, { shape: { ...(selected.shape || {}), stroke: e.target.value } })} placeholder="#000000" />
                <label className="text-sm">Stroke W</label><input type="number" className="bg-slate-900 px-2 py-1 rounded" value={selected.shape?.strokeWidth || 2} onChange={(e) => setClip(selected.id, { shape: { ...(selected.shape || {}), strokeWidth: Number(e.target.value || 0) } })} />
                {selected.shape?.kind === "rect" && (<><label className="text-sm">Radius</label><input type="number" className="bg-slate-900 px-2 py-1 rounded" value={selected.shape?.radius || 8} onChange={(e) => setClip(selected.id, { shape: { ...(selected.shape || {}), radius: Number(e.target.value || 0) } })} /></>)}
              </div>
            </div>)}

            {/* Actions */}
            {selected.type !== "audio" && (<div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase text-slate-400">Timeline Actions</div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 bg-emerald-700 rounded text-xs" onClick={() => {
                    const id = "act_" + Math.random().toString(36).slice(2, 7);
                    const newAct: Action = { id, type: "appear", start: Math.max(0, time), end: Math.min(duration, time + 1) };
                    setClip(selected.id, { actions: [...(selected.actions || []), newAct] });
                  }}>+ Appear</button>
                  <button className="px-2 py-1 bg-indigo-700 rounded text-xs" onClick={() => {
                    const id = "act_" + Math.random().toString(36).slice(2, 7);
                    const newAct: Action = { id, type: "move", start: Math.max(0, time), end: Math.min(duration, time + 2), fromX: selected.x || 50, fromY: selected.y || 50, toX: clamp((selected.x || 50) + 10, 0, 100), toY: selected.y || 50 };
                    setClip(selected.id, { actions: [...(selected.actions || []), newAct] });
                  }}>+ Move</button>
                  <button className="px-2 py-1 bg-amber-700 rounded text-xs" onClick={() => {
                    const id = "act_" + Math.random().toString(36).slice(2, 7);
                    const newAct: Action = { id, type: "highlight", start: Math.max(0, time), end: Math.min(duration, time + 1.5), intensity: 0.15 };
                    setClip(selected.id, { actions: [...(selected.actions || []), newAct] });
                  }}>+ Highlight</button>
                </div>
              </div>
              <div className="space-y-2">
                {(selected.actions || []).length === 0 && <div className="text-slate-400 text-sm">Chưa có action. Thêm ở bên trên.</div>}
                {(selected.actions || []).map(a => (
                  <div key={a.id} className="bg-slate-900 rounded p-2">
                    <div className="flex items-center gap-2 text-sm">
                      <select className="bg-slate-800 px-2 py-1 rounded" value={a.type} onChange={(e) => {
                        const t = e.target.value as ActionType; setClip(selected.id, { actions: (selected.actions || []).map(x => x.id === a.id ? { ...a, type: t } : x) });
                      }}>
                        <option value="appear">appear</option><option value="move">move</option><option value="highlight">highlight</option>
                      </select>
                      <label>Start</label><input type="number" className="bg-slate-800 px-2 py-1 rounded w-20" value={a.start} onChange={(e) => {
                        const v = clamp(Number(e.target.value || 0), 0, duration); const patch = { ...a, start: v, end: Math.max(v + 0.05, a.end) }; setClip(selected.id, { actions: (selected.actions || []).map(x => x.id === a.id ? patch : x) });
                      }} />
                      <label>End</label><input type="number" className="bg-slate-800 px-2 py-1 rounded w-20" value={a.end} onChange={(e) => {
                        const v = clamp(Number(e.target.value || 0), 0, duration); const patch = { ...a, end: Math.max(v, a.start + 0.05) }; setClip(selected.id, { actions: (selected.actions || []).map(x => x.id === a.id ? patch : x) });
                      }} />
                      <button className="ml-auto text-red-300 hover:text-red-200" onClick={() => {
                        setClip(selected.id, { actions: (selected.actions || []).filter(x => x.id !== a.id) });
                      }}>Xóa</button>
                    </div>
                    {a.type === "move" && (<div className="mt-2 grid grid-cols-4 gap-2 text-sm">
                      <label>From X</label><input type="number" className="bg-slate-800 px-2 py-1 rounded" value={a.fromX ?? selected.x ?? 50} onChange={(e) => { const v = clamp(Number(e.target.value || 0), 0, 100); setClip(selected.id, { actions: (selected.actions || []).map(x => x.id === a.id ? { ...a, fromX: v } : x) }); }} />
                      <label>From Y</label><input type="number" className="bg-slate-800 px-2 py-1 rounded" value={a.fromY ?? selected.y ?? 50} onChange={(e) => { const v = clamp(Number(e.target.value || 0), 0, 100); setClip(selected.id, { actions: (selected.actions || []).map(x => x.id === a.id ? { ...a, fromY: v } : x) }); }} />
                      <label>To X</label><input type="number" className="bg-slate-800 px-2 py-1 rounded" value={a.toX ?? selected.x ?? 50} onChange={(e) => { const v = clamp(Number(e.target.value || 0), 0, 100); setClip(selected.id, { actions: (selected.actions || []).map(x => x.id === a.id ? { ...a, toX: v } : x) }); }} />
                      <label>To Y</label><input type="number" className="bg-slate-800 px-2 py-1 rounded" value={a.toY ?? selected.y ?? 50} onChange={(e) => { const v = clamp(Number(e.target.value || 0), 0, 100); setClip(selected.id, { actions: (selected.actions || []).map(x => x.id === a.id ? { ...a, toY: v } : x) }); }} />
                    </div>)}
                    {a.type === "highlight" && (<div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <label>Intensity</label><input type="number" step={0.01} className="bg-slate-800 px-2 py-1 rounded" value={a.intensity ?? 0.15} onChange={(e) => { const v = Math.max(0, Number(e.target.value || 0)); setClip(selected.id, { actions: (selected.actions || []).map(x => x.id === a.id ? { ...a, intensity: v } : x) }); }} />
                    </div>)}
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between">
                <button className="text-red-300 hover:text-red-200" onClick={() => removeClip(selected.id)}>Xóa thực thể này</button>
                <div className="text-slate-500 text-xs">Mẹo: chọn & kéo trên preview để xác định vị trí; thêm action Move để tween giữa 2 vị trí.</div>
              </div>
            </div>)}
          </div>
        )}
      </div>
    </div>

    <div className="px-4 py-2 border-t border-slate-800 text-xs text-slate-400">
      Tips: kéo clip ngang để chỉnh thời gian; kéo lên/xuống để đổi lane (z-index). Speed thay đổi tốc độ phát. Arrow keys để tinh chỉnh vị trí. Shift để khóa trục khi kéo.
    </div>
  </div>);
}
