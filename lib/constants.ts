// ── Board geometry ────────────────────────────────────────────────────────────
export const HEX_SIZE = 70;            // hex circumradius in SVG units
export const SQRT3 = Math.sqrt(3);
export const BOARD_MARGIN_RATIO = 2.2; // ocean margin as a multiple of HEX_SIZE

// ── Hex tile rendering (as fractions of HEX_SIZE) ─────────────────────────────
export const TOKEN_RADIUS_RATIO  = 0.28;  // number token circle radius
export const TOKEN_FONT_RATIO    = 0.25;  // number token font size
export const TOKEN_DOT_RATIO     = 0.026; // probability dot radius
export const TOKEN_DOT_Y_RATIO   = 0.60;  // dot row offset below token center
export const LABEL_Y_RATIO       = 0.52;  // resource label vertical offset above center
export const LABEL_FONT_RATIO    = 0.19;  // resource label font size

// ── Port rendering (as fractions of HEX_SIZE) ─────────────────────────────────
export const PORT_OFFSET_RATIO   = 1.55;  // distance from hex center to port circle center
export const PORT_RADIUS_RATIO   = 0.24;  // port circle radius
