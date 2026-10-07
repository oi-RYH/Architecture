# Map entrance and hanji ground

- Map: Kim Jeong-ho, Daedongyeojido (1861), Kyujanggak copy. https://commons.wikimedia.org/wiki/File:Daedongyeojido-full.jpg Public domain / PD-Art. Downloaded 1280 × 2153 image.
- Hanyang marker: approximate enclosure center x 42%, y 56.55%; checked against Commons Seoul annotation and tile 13-04. Marker is an added interface symbol, not an original map mark or precise survey point.
- Hanji: generated texture, original at /tmp/hanji-assets/hanji-paper.png, deployed JPEG 1024 × 1024. Used as ground texture; no sky changes.
- Routes: index.html map, building.html existing explorer. Return restores map pan/zoom via sessionStorage; a new document loads model again using browser cache and normal GPU prewarm.
- Reduced motion skips ink transition. Links function without map JS. Map buttons, pointer pan, wheel/pinch zoom, keyboard arrows/+/- supported.

## High-resolution map update

Original raster: 17,837 × 30,000 pixels, 103,889,511-byte JPEG. Source https://commons.wikimedia.org/wiki/File:Daedongyeojido-full.jpg (same PD-Art public-domain scan). No faithful vector edition located; no automatic tracing used. Full source resolution retained in a five-level AVIF tile pyramid, 1024px tiles. Client loads visible tiles plus one-tile margin, selects level by rendered size and device pixel ratio (capped at 2), keeps prior tiles until replacements are decoded, and uses the small JPEG as fallback. Deliberate home-page blur drops to zero when zooming. Zoom is bounded to source resolution; native scan detail remains the ultimate limit.

## Ink absorption reveal

Resting map uses 43% opacity on each tile, no blur. A viewport-sized full-resolution snapshot reveals the original map through a fixed, multiscale fiber arrival field; the mask advances monotonically instead of animating a circular outline. Generated ink-fiber reference controls local spread and initial absorption stain. Drop 520ms, absorption 2300ms, settled hold 450ms, exit fade 350ms. Reduced-motion skips transition. Background paper remains unchanged. Physics inspiration: https://www.nature.com/articles/s41598-024-82706-y (capillary feathering along paper fibers); visual interpretation, not a physically calibrated fluid simulation.

## Local reveal boundary

All locations use ink-policy.js: maximum radius = 1.75% of rendered full-map width (3.5% diameter), a Seoul-scale visual approximation on this non-georeferenced historic map. This is not a literal Seoul administrative polygon. Arrival field uses map-relative coordinates, with an explicit zero-alpha envelope outside the shared radius. Initial ink stain is clipped to the same boundary. Never inflate to a viewport-sized reveal. Future locations should use the same revealInk function without per-location radius overrides.
