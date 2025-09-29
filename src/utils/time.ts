export const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
export const fmtTime = (sec: number) => {
  sec = Math.max(0, sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};
export const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
