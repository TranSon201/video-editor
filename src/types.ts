export type EntityType = "text" | "image" | "audio" | "shape";
export type Easing = "linear" | "easeIn" | "easeOut" | "easeInOut" | "circIn" | "circOut" | "circInOut";
export type AnimationName =
  | "none" | "fadeIn" | "fadeOut" | "slideInLeft" | "slideInRight" | "slideInTop" | "slideInBottom"
  | "scaleIn" | "scaleOut" | "rotateIn" | "rotateOut" | "blurIn" | "bounceIn" | "zoomIn" | "zoomOut";
export type SlideAnimName =
  | "fade" | "moveLeft" | "moveRight" | "moveUp" | "moveDown" | "flipX" | "flipY"
  | "zoomIn" | "zoomOut" | "scaleIn" | "scaleOut" | "rotateIn" | "rotateOut"
  | "skewLeft" | "skewRight" | "kenBurns" | "drape" | "wipe" | "split";
export type ActionType = "appear" | "move" | "highlight";
export type Action = { id: string; type: ActionType; start: number; end: number; fromX?: number; fromY?: number; toX?: number; toY?: number; intensity?: number; };
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
export type SlideTransition = { in: SlideAnimName; out: SlideAnimName; };
export type Slide = { id: string; name: string; duration: number; transition: SlideTransition; clips: Clip[]; bgColor?: string; bgImage?: string; enabled?: boolean; };
export type Project = { fps: number; width: number; height: number; slides: Slide[]; };
