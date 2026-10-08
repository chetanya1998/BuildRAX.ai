import type { CanvasPoint } from "./canvas-interaction";

export const MAX_STROKE_POINTS = 2048;

/** Bounded streaming buffer. Compaction preserves the start and latest endpoint. */
export class FreehandBuffer {
  points: CanvasPoint[] = [];
  append(point: CanvasPoint, endpoint = false) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    const previous = this.points.at(-1);
    const distance = previous ? Math.hypot(point.x - previous.x, point.y - previous.y) : Infinity;
    if (distance === 0 || (!endpoint && distance < 1)) return;
    if (this.points.length >= MAX_STROKE_POINTS) {
      this.points = this.points.filter((_, index) => index % 2 === 0 || index === this.points.length - 1);
    }
    this.points.push({ ...point });
  }
}

export function smoothFreehandPath(points: CanvasPoint[]) {
  if (points.length < 2) return "";
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const before = points[index - 1] ?? points[index];
    const start = points[index];
    const end = points[index + 1];
    const after = points[index + 2] ?? end;
    const c1 = { x: start.x + (end.x - before.x) / 6, y: start.y + (end.y - before.y) / 6 };
    const c2 = { x: end.x - (after.x - start.x) / 6, y: end.y - (after.y - start.y) / 6 };
    path += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
  }
  return path;
}
