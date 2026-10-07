// Shared by every location. A Seoul-scale visual approximation on this historic
// map, not a georeferenced administrative boundary. Never size by the viewport.
export const INK_RADIUS_MAP_WIDTH = .0175;
export function inkRadiusForMapWidth(renderedMapWidth){return Math.max(0,renderedMapWidth)*INK_RADIUS_MAP_WIDTH;}
