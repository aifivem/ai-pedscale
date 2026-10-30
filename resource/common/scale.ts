import { bool, num, record } from "@aicore-fivem/lib/shared";

/** Player state: `{ height, width }` of a scaled character (absent at 1 x 1); every client draws it. */
export const SCALE_STATE = "aiPedScale";
/** ai-core character metadata key the scale is kept under. */
export const SCALE_META = "pedScale";

export interface Scale {
  height: number;
  width: number;
}

export const toScale = (v: unknown): Scale | undefined => {
  const r = record(v);
  return typeof r.height === "number" && typeof r.width === "number"
    ? { height: r.height, width: r.width }
    : undefined;
};

export interface Settings {
  heightOn: boolean;
  widthOn: boolean;
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  /** Metres within which other players' scale is drawn. */
  drawDistance: number;
}

export function readSettings(raw: unknown): Settings {
  const s = record(raw);
  return {
    heightOn: bool(s.heightOn, true),
    widthOn: bool(s.widthOn, false),
    minHeight: num(s.minHeight, 0.85, 0.5, 1),
    maxHeight: num(s.maxHeight, 1.1, 1, 1.5),
    minWidth: num(s.minWidth, 0.9, 0.5, 1),
    maxWidth: num(s.maxWidth, 1.15, 1, 1.5),
    drawDistance: num(s.drawDistance, 100, 20, 300),
  };
}
