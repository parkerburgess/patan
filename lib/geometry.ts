import { SQRT3 } from "@/lib/constants";
import type { HexCoord } from "@/types/game";

/**
 * Convert axial hex coordinates (q, r) to SVG pixel position.
 * Assumes pointy-top orientation.
 */
export function axialToPixel(coord: HexCoord, size: number): { x: number; y: number } {
  return {
    x: size * SQRT3 * (coord.q + coord.r / 2),
    y: size * 1.5 * coord.r,
  };
}

/**
 * Build the SVG `points` attribute string for a pointy-top hexagon centered at (cx, cy).
 * Corner i is at angle (60*i + 30)°.
 */
export function hexPointsString(cx: number, cy: number, size: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = ((60 * i + 30) * Math.PI) / 180;
    return `${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`;
  }).join(" ");
}

/**
 * Returns the 6 corner points of a pointy-top hexagon centered at (cx, cy).
 * Corner i is at angle (60*i + 30)°.
 */
export function hexCornerPoints(
  cx: number,
  cy: number,
  size: number,
): Array<{ x: number; y: number }> {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = ((60 * i + 30) * Math.PI) / 180;
    return { x: cx + size * Math.cos(angle), y: cy + size * Math.sin(angle) };
  });
}

/**
 * Midpoint of a hex edge in SVG pixel space.
 * Edge i lies between corner i and corner (i+1)%6.
 *
 * Edge directions for pointy-top hexagons (SVG y-down):
 *   0 = SE,  1 = SW,  2 = W,  3 = NW,  4 = NE,  5 = E
 */
export function edgeMidpoint(
  cx: number,
  cy: number,
  size: number,
  edgeIndex: number,
): { x: number; y: number } {
  const aRad = ((60 * edgeIndex + 30) * Math.PI) / 180;
  const bRad = ((60 * (edgeIndex + 1) + 30) * Math.PI) / 180;
  return {
    x: cx + size * (Math.cos(aRad) + Math.cos(bRad)) / 2,
    y: cy + size * (Math.sin(aRad) + Math.sin(bRad)) / 2,
  };
}
