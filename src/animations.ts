import type { AnimationName, Easing, SlideAnimName } from "./types";

export function buildInVariant(name: AnimationName) {
  switch (name) {
    case "fadeIn": return { initial: { opacity: 0 }, animate: { opacity: 1 } };
    case "slideInLeft": return { initial: { x: -80, opacity: 0 }, animate: { x: 0, opacity: 1 } };
    case "slideInRight": return { initial: { x: 80, opacity: 0 }, animate: { x: 0, opacity: 1 } };
    case "slideInTop": return { initial: { y: -60, opacity: 0 }, animate: { y: 0, opacity: 1 } };
    case "slideInBottom": return { initial: { y: 60, opacity: 0 }, animate: { y: 0, opacity: 1 } };
    case "scaleIn":
    case "zoomIn": return { initial: { scale: 0.85, opacity: 0 }, animate: { scale: 1, opacity: 1 } };
    case "scaleOut":
    case "zoomOut": return { initial: { scale: 1.1, opacity: 0 }, animate: { scale: 1, opacity: 1 } };
    case "rotateIn": return { initial: { rotate: -15, opacity: 0 }, animate: { rotate: 0, opacity: 1 } };
    case "rotateOut": return { initial: { rotate: 15, opacity: 0 }, animate: { rotate: 0, opacity: 1 } };
    case "blurIn": return { initial: { filter: "blur(8px)", opacity: 0 }, animate: { filter: "blur(0px)", opacity: 1 } } as any;
    case "bounceIn": return { initial: { scale: 0.6, opacity: 0 }, animate: { scale: [0.6, 1.05, 0.98, 1], opacity: 1 } } as any;
    default: return { initial: {}, animate: {} };
  }
}
export function buildOutVariant(name: AnimationName) {
  switch (name) {
    case "fadeOut": return { exit: { opacity: 0 } };
    case "slideInLeft": return { exit: { x: -60, opacity: 0 } };
    case "slideInRight": return { exit: { x: 60, opacity: 0 } };
    case "slideInTop": return { exit: { y: -50, opacity: 0 } };
    case "slideInBottom": return { exit: { y: 50, opacity: 0 } };
    case "scaleIn":
    case "zoomIn": return { exit: { scale: 0.9, opacity: 0 } };
    case "scaleOut":
    case "zoomOut": return { exit: { scale: 1.1, opacity: 0 } };
    case "rotateIn": return { exit: { rotate: -10, opacity: 0 } };
    case "rotateOut": return { exit: { rotate: 10, opacity: 0 } };
    case "blurIn": return { exit: { filter: "blur(6px)", opacity: 0 } } as any;
    case "bounceIn": return { exit: { scale: 0.9, opacity: 0 } };
    case "none":
    default: return { exit: {} };
  }
}
export const slideVariants: Record<SlideAnimName, any> = {
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
export const easingMap: Record<Easing, any> = {
  linear: "linear",
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  circIn: [0.55, 0, 1, 0.45],
  circOut: [0, 0.55, 0.45, 1],
  circInOut: [0.85, 0, 0.15, 1],
};
