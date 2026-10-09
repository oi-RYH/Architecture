# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: people viewing this as the author's portfolio piece — reviewers, peers and visitors who judge it on first impression and craft. Secondary: anyone curious about Korean traditional architecture who wants to explore a real building's structure.

## Product Purpose
반닫이 is an archive of Korean traditional buildings. Each building gets its own record that can be explored in 3D and taken apart layer by layer (기단·월대, 목조가구, 공포부, 처마부, 지붕부, 수장·창호, 어좌·기타 장식). Success: a visitor understands within seconds that this is a curated archive of buildings, enters one, and leaves remembering how the building came apart.

## Positioning
The models are official heritage assets (국가유산청 2023 digital source data), not hand-made approximations, and every record is split into explanatory layers that can be exploded and isolated. The ink elevation drawings ("밑그림") are rendered from the same model, so drawing and 3D are one object.

## Operating Context
Static site served from `dist/` (no build step), Three.js r180, deployed to an existing ChatGPT Sites project. Models are heavy (~125 MiB geometry, GPU-compressed textures); first load can take tens of seconds and must never be faked away.

## Capabilities and Constraints
- Currently one record: 경복궁 근정전. The archive must read as a collection that will grow.
- Keep: the drafting sequence (ink plates drawn bottom-up while the model loads, seal stamp, dolly-zoom into 3D) — user-approved.
- Keep: layer explode/isolate, 7-layer reading, full-detail model quality (no LOD, no texture downgrades).
- Do not claim digital-twin accuracy; layer split is interpretive.
- Removed by user: the left "펼침" gauge in the building room.

## Brand Commitments
Name 반닫이. Must carry Korean traditional beauty. User asked for restraint and empty space (여백과 절제) combined with strong, memorable motion. Rejected: a literal, clip-art hanok facade (eaves/lattice doors drawn in SVG) that did not read as an archive.

## Evidence on Hand
- `dist/models/` official Geunjeongjeon glTF + provenance.json.
- `dist/assets/archive/geunjeongjeon/plate-*.webp` (7 ink elevation plates rendered from the model), `shadow.webp` silhouette.
- `dist/assets/hanji.jpg`, `dist/assets/daedongyeojido.jpg` (public domain map).
No testimonials, press, or additional buildings exist yet; do not fabricate them.

## Product Principles
1. The real building is the hero; decoration never stands in for it.
2. Restraint first: empty space carries the weight, motion carries the memory.
3. One drawing, one model: ink and 3D are the same object at different moments.
4. Honest about scale and loading; the wait is designed, never hidden.
