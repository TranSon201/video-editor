// importer.ts
type ExternalSlide = any; // mảng slide từ JSON của bạn
import type { Project, Slide, Clip, SlideAnimName } from "./App"; // điều chỉnh đường dẫn nếu khác
import type { AnimationName } from "./types";

// ---- Helpers ----
const PROJECT_W = 1920;
const PROJECT_H = 1080;

function parseClock(t: any): number {
  if (t == null || t === "none") return 0;
  if (typeof t === "number") return t;
  const s = String(t).trim();
  if (!s) return 0;
  const parts = s.split(":").map(Number);
  // hh:mm:ss(.ms) | mm:ss(.ms) | ss(.ms)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + Number(parts[2]);
  if (parts.length === 2) return parts[0] * 60 + Number(parts[1]);
  return Number(s) || 0;
}

function pxToPct(px: any, base: number): number | undefined {
  if (px == null) return undefined;
  const n = typeof px === "string" ? parseFloat(px) : Number(px);
  if (!isFinite(n) || base <= 0) return undefined;
  return (n / base) * 100;
}

function cleanHtml(s: string): string {
  // Editor hiện tại không render HTML trong text -> loại bỏ thẻ đơn giản
  return s.replace(/<[^>]+>/g, "");
}

const transitionMap = new Set<SlideAnimName>([
  "fade","moveLeft","moveRight","moveUp","moveDown","flipX","flipY",
  "zoomIn","zoomOut","scaleIn","scaleOut","rotateIn","rotateOut",
  "skewLeft","skewRight","kenBurns","drape","wipe","split"
]);

function mapTransition(x: any): SlideAnimName {
  const k = String(x || "fade").trim() as SlideAnimName;
  return transitionMap.has(k) ? k : "fade";
}

function mapAnim(x: any): AnimationName {
  const s = String(x || "").toLowerCase();
  // map các tên lạ sang gần nhất trong editor
  if (s === "fadein") return "fadeIn";
  if (s === "fadeout") return "fadeOut";
  if (s === "bouncescale" || s === "bounce") return "bounceIn";
  if (s === "flyin") return "slideInRight";
  if (s === "randombars") return "zoomIn";
  if (s === "spit" || s === "split") return "scaleIn";
  if (s === "zoomin") return "zoomIn";
  if (s === "zoomout") return "zoomOut";
  return (["fadeIn","fadeOut","slideInLeft","slideInRight","slideInTop","slideInBottom","scaleIn","scaleOut","rotateIn","rotateOut","blurIn","bounceIn","zoomIn","zoomOut"] as AnimationName[])
    .find(a => a.toLowerCase() === s) || "fadeIn";
}

function parsePos(p: any): { x?: number; y?: number } {
  if (!p || p === "none") return {};
  if (Array.isArray(p) && p.length >= 2) {
    return { x: p[0]*100, y: p[1]*100 };
  }
  if (typeof p === "string") {
    try {
      const arr = JSON.parse(p);
      if (Array.isArray(arr) && arr.length >= 2) return { x: arr[0]*100, y: arr[1]*100 };
    } catch {}
    // cố gắng bóc tách dạng "[0.5, 0.5]"
    const m = p.match(/-?\d+(\.\d+)?/g);
    if (m && m.length >= 2) return { x: parseFloat(m[0])*100, y: parseFloat(m[1])*100 };
  }
  return {};
}

function parseStyle(style: any): Record<string, any> {
  if (!style) return {};
  if (typeof style === "string") {
    try { return JSON.parse(style); } catch {}
  }
  return style || {};
}

function isCircleStyle(style: any): boolean {
  const br = style?.borderRadius;
  return (typeof br === "string" && br.includes("100")) || br === 999 || br === "50%";
}

// ---- Main converter ----
export function convertLessonJsonToProject(
  slidesIn: ExternalSlide[],
  opts?: { fps?: number; width?: number; height?: number }
): Project {
  const fps = opts?.fps ?? 30;
  const width = opts?.width ?? PROJECT_W;
  const height = opts?.height ?? PROJECT_H;

  const slides: Slide[] = (slidesIn || []).map((s: any, idx: number) => {
    const name = String(s.title || s.id || `Slide ${idx+1}`);
    const trans = mapTransition(s.transition);
    const clips: Clip[] = [];

    // Optional: dựng nền từ bg/bg_image
    if (s.bg_image) {
      clips.push({
        id: `bgimg_${idx}`,
        type: "image",
        start: 0,
        duration: 9999,
        layer: 0,
        x: 50, y: 50, w: 100, h: 100,
        image: { src: String(s.bg_image), objectFit: "cover" },
        inAnim: "fadeIn", outAnim: "fadeOut", inDur: 0.2, outDur: 0.2, easing: "easeOut",
        opacity: 1
      });
    } else if (s.bg) {
      // s.bg có thể là lớp tailwind "bg-[#02BDC7]" -> trích màu
      const m = String(s.bg).match(/#([0-9a-fA-F]{3,8})/);
      const fill = m ? `#${m[1]}` : "#000000";
      clips.push({
        id: `bgrect_${idx}`,
        type: "shape",
        start: 0,
        duration: 9999,
        layer: 0,
        x: 50, y: 50, w: 100, h: 100,
        shape: { kind: "rect", fill, radius: 0 },
        inAnim: "fadeIn", outAnim: "fadeOut", inDur: 0.2, outDur: 0.2, easing: "easeOut",
        opacity: 1
      });
    }

    let maxEnd = 0;

    (s.timeline || []).forEach((it: any, j: number) => {
      const start = parseClock(it.start);
      const end = parseClock(it.end);
      const dur = Math.max(0.2, end - start || 0);
      maxEnd = 180;

      const pos = parsePos(it.position);
      const style = parseStyle(it.style);

      const base: Partial<Clip> = {
        id: String(it.element_key || `${s.id || idx}_${j}`),
        start, duration: dur,
        layer: it.element_type === "audio" ? 1 : it.element_type === "image" ? 5 : it.element_type === "text" ? 10 : 6,
        inAnim: mapAnim(it.animation),
        outAnim: "fadeOut",
        inDur: it.duration_animation && it.duration_animation !== "none" ? parseClock(it.duration_animation) || 0.6 : 0.6,
        outDur: 0.6,
        easing: "easeOut",
        x: pos.x, y: pos.y,
        opacity: 1
      };

      if (it.element_type === "text") {
        const fontSize = style.fontSize ?? 48;
        const color = style.color ?? "#ffffff";
        const fontWeight = style.fontWeight === "bold" ? 700 : (Number(style.fontWeight) || 600);
        clips.push({
          ...base,
          duration: 10,
          type: "text",
          text: {
            content: cleanHtml(String(it.element_content || "")),
            fontSize, color, align: "center" as const, fontWeight
          },
          name: "Text"
        } as Clip);
      } else if (it.element_type === "audio") {
        clips.push({
          ...base,
          type: "audio",
          audio: { src: String(it.file_record || ""), volume: 1 },
          name: "Audio"
        } as Clip);
      } else if (it.element_type === "circle") {
        const fill = style.backgroundColor || "#ffffff";
        const wPct = pxToPct(style.width, width);
        const hPct = pxToPct(style.height, height);
        clips.push({
          ...base,
          duration: 10,
          type: "shape",
          shape: { kind: isCircleStyle(style) ? "circle" : "rect", fill },
          w: wPct, h: hPct,
          name: "Circle"
        } as Clip);
      } else if (it.element_type === "image") {
        
      } else if (it.element_type === "table") {
        // Map bảng → text nhiều dòng (giữ nội dung để hiển thị)
        const content = cleanHtml(String(it.element_content || "")).replace(/\\n/g, "\n");
        clips.push({
          ...base,
          type: "text",
          text: { content, fontSize: style.fontSize ?? 18, color: style.color ?? "#1a2954", align: "left", fontWeight: 600 },
          name: "Table-as-text"
        } as Clip);
      }
    });

    const duration = Math.max(maxEnd || 0, 8);
    const slide: Slide = {
      id: String(s.id || `s${idx+1}`),
      name,
      duration,
      transition: { in: mapTransition(s.transition), out: mapTransition(s.transition) },
      clips: clips.sort((a, b) => (a.layer - b.layer) || (a.start - b.start)),
    };
    return slide;
  });

  const proj: Project = { fps, width, height, slides };
  return proj;
}
