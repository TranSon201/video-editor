import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Clip, Project, Slide } from "../types";

type Ctx = {
  project: Project; setProject: React.Dispatch<React.SetStateAction<Project>>;
  slideIdx: number; setSlideIdx: (i: number) => void;
  time: number; setTime: (t: number) => void;
  playing: boolean; setPlaying: (v: boolean) => void;
  speed: number; setSpeed: (v: number) => void;
  selectedId: string | null; setSelectedId: (id: string | null) => void;
  currentSlide: Slide;
  setClip: (id: string, patch: Partial<Clip>) => void;
  addClip: (clip: Clip) => void;
  removeClip: (id: string) => void;
  importJSON: (raw: string) => void;
  exportJSON: () => string;
};

const defaultProject: Project = {
  fps: 30, width: 1920, height: 1080,
  slides: [{
    id: "s1", name: "Slide 1", duration: 10,
    transition: { in: "fade", out: "fade" },
    clips: [{
      id: "t1", type: "text", name: "Title", start: 0, duration: 4, layer: 10,
      inAnim: "fadeIn", outAnim: "fadeOut", inDur: 0.6, outDur: 0.6, x: 50, y: 25,
      text: { content: "Mini Timeline Editor", fontSize: 60, color: "#fff", align: "center", fontWeight: 800 },
      actions: [{ id: "a1", type: "appear", start: 0, end: 1 }]
    }]
  }]
};

const ProjectContext = createContext<Ctx>(null as any);

export function ProjectProvider({ children }: { children: React.ReactNode }){
  const [project, setProject] = useState<Project>(() => {
    try { const s = localStorage.getItem("mte_autosave_v3"); if (s) return JSON.parse(s); } catch {}
    return defaultProject;
  });
  const [slideIdx, setSlideIdx] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const currentSlide = useMemo(() => project.slides[slideIdx], [project, slideIdx]);

  useEffect(() => { localStorage.setItem("mte_autosave_v3", JSON.stringify(project)); }, [project]);
  useEffect(() => { if (!currentSlide) return; if (time > currentSlide.duration) setTime(currentSlide.duration - 0.0001); }, [slideIdx, currentSlide?.duration]);

  const setClip = (id: string, patch: Partial<Clip>) => {
    setProject(p => ({ ...p, slides: p.slides.map((s,i)=> i!==slideIdx ? s : ({ ...s, clips: s.clips.map(c => c.id!==id ? c : ({ ...c, ...patch })) })) }));
  };
  const addClip = (clip: Clip) => setProject(p => ({ ...p, slides: p.slides.map((s,i)=> i!==slideIdx ? s : ({ ...s, clips: [...s.clips, clip] })) }));
  const removeClip = (id: string) => {
    setProject(p => ({ ...p, slides: p.slides.map((s,i)=> i!==slideIdx ? s : ({ ...s, clips: s.clips.filter(c=>c.id!==id) })) }));
    if (selectedId === id) setSelectedId(null);
  };
  const importJSON = (raw: string) => { try { setProject(JSON.parse(raw)); } catch { alert("Invalid JSON"); } };
  const exportJSON = () => JSON.stringify(project, null, 2);

  const value: Ctx = { project, setProject, slideIdx, setSlideIdx, time, setTime, playing, setPlaying, speed, setSpeed, selectedId, setSelectedId, currentSlide, setClip, addClip, removeClip, importJSON, exportJSON };
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
export function useProject(){ return useContext(ProjectContext); }
