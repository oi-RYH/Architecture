---
name: 반닫이
description: An archive of Korean traditional buildings kept as a shelf of Joseon thread-bound books on hanji; opening a book is entering the building.
colors:
  juhong-seal: "#b8432b"
  seal-paper: "#f6e9d6"
  thread-deep: "#7a1d12"
  thread-bright: "#e2705d"
  gardenia-cover: "#bd9a5a"
  cover-board: "#8f7543"
  blank-cover: "#d6cbb3"
  slip-paper: "#f4eddd"
  page-hanji: "#f2ead8"
  page-block-line: "#cdbf9f"
  plaque-lacquer: "#1d1e23"
  plaque-gold: "#d8b66a"
  noerok-green: "#3f7a68"
  layer-base: "#8f8b80"
  layer-frame: "#8e3b2a"
  layer-brackets: "#3f7a68"
  layer-eaves: "#2f5d7c"
  layer-roof: "#45484d"
  layer-finishes: "#c07a35"
  layer-ornaments: "#c39a32"
  hanji: "#efe6d3"
  hanji-light: "#f7f1e4"
  ink: "#1d1a16"
  ink-soft: "#4b443a"
  ink-faint: "#685f52"
typography:
  display:
    fontFamily: "Noto Serif KR, Nanum Myeongjo, AppleMyungjo, serif"
    fontSize: "clamp(34px, 3.6vw, 56px)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.06em"
  display-vertical:
    fontFamily: "Noto Serif KR, Nanum Myeongjo, AppleMyungjo, serif"
    fontSize: "clamp(56px, 7vw, 112px)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.12em"
  headline:
    fontFamily: "Noto Serif KR, Nanum Myeongjo, AppleMyungjo, serif"
    fontSize: "clamp(46px, 6vw, 80px)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.1em"
  title:
    fontFamily: "Noto Serif KR, Nanum Myeongjo, AppleMyungjo, serif"
    fontSize: "20px"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "0.24em"
  title-item:
    fontFamily: "Noto Serif KR, Nanum Myeongjo, AppleMyungjo, serif"
    fontSize: "15.5px"
    fontWeight: 700
    letterSpacing: "0.04em"
  body-lead:
    fontFamily: "Gowun Batang, Noto Serif KR, AppleMyungjo, serif"
    fontSize: "clamp(15px, 1.4vw, 18px)"
    fontWeight: 400
    lineHeight: 2
  body:
    fontFamily: "Gowun Batang, Noto Serif KR, AppleMyungjo, serif"
    fontSize: "14.5px"
    fontWeight: 400
    lineHeight: 1.85
  label:
    fontFamily: "Gowun Batang, Noto Serif KR, AppleMyungjo, serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0.1em"
  label-action:
    fontFamily: "Gowun Batang, Noto Serif KR, AppleMyungjo, serif"
    fontSize: "15px"
    fontWeight: 400
    letterSpacing: "0.14em"
  numeral:
    fontFamily: "Noto Serif KR, Nanum Myeongjo, AppleMyungjo, serif"
    fontSize: "17px"
    fontWeight: 700
    letterSpacing: "0.08em"
rounded:
  none: "0px"
  thread: "2px"
  full: "50%"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  room-inset: "clamp(16px, 2.4vw, 32px)"
  edge: "clamp(20px, 3.6vw, 56px)"
  shelf-gap: "clamp(30px, 4.4vw, 80px)"
  section: "clamp(64px, 10vw, 128px)"
components:
  seal-button:
    backgroundColor: "{colors.juhong-seal}"
    textColor: "{colors.seal-paper}"
    rounded: "{rounded.none}"
    size: "42px"
  seal-action:
    textColor: "{colors.ink}"
    typography: "{typography.label-action}"
    padding: "0 0 4px"
  ink-button:
    backgroundColor: "{colors.hanji-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
  ink-button-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.hanji-light}"
  pager-button:
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "46px"
  title-slip:
    backgroundColor: "{colors.slip-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    width: "23%"
    height: "54%"
  book-cover:
    backgroundColor: "{colors.gardenia-cover}"
    rounded: "{rounded.none}"
    height: "min(46svh, 430px, 62vw)"
  layer-seal:
    textColor: "{colors.juhong-seal}"
    rounded: "{rounded.none}"
    size: "26px"
  layer-seal-active:
    backgroundColor: "{colors.juhong-seal}"
    textColor: "{colors.hanji-light}"
  mode-toggle-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.hanji-light}"
    padding: "6px 12px"
  room-panel:
    backgroundColor: "{colors.hanji-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "22px 22px 26px"
    width: "clamp(300px, 25vw, 380px)"
  plaque:
    backgroundColor: "{colors.plaque-lacquer}"
    textColor: "{colors.plaque-gold}"
    typography: "{typography.title}"
    padding: "0.42em 0.7em"
---

# Design System: 반닫이

Brand update (2026-10-10): use 반닫이 without a Hanja substitute. Keep the masthead wordmark on one line. The room seal sets the three Hangul syllables vertically at clamp(10px, 1.1vw, 16px); the miniature spread seal uses 1.6% of book width, vertically, to fit its existing square. These are decorative brand marks, not reading-copy sizes.

## Overview

**Creative North Star: "The Bound Shelf on Hanji"**

The archive is a reading room, not a website. Every building is one Joseon thread-bound book (선장본) standing on a sheet of hanji: gardenia-yellow cover pressed with a 능화문 diamond pattern, a white 제첨 title slip carrying the hanja title vertically, five red-thread stitches (오침안정법) down the right binding edge, and a visible page block. The shelf grows by one blank book at a time. Opening a book swings the cover on its binding, shows a model-rendered ink elevation across the gutter, and dives into it; the room that follows is the same hanji, where ink plates draft bottom-up, a vermilion 落款 seal lands, and the drawing dissolves into the 3D building with a seven-layer reading panel.

Density is low and deliberate. Empty paper carries the weight; one book is forward, the rest recede (55% opacity, desaturated, pushed back 220px in Z). Type is ink on paper, vertical where Korean bookmaking would set it vertical. Colour beyond ink and paper is pigment, not interface: gardenia on covers, vermilion on seals and binding, dancheong tones only as layer markers. The literal hanok facade and the web card carousel are both rejected; the book is the container.

Motion is the memory. Covers do not slide; they hinge, driven by registered angle properties so the browser interpolates the turn itself. Every sequence is slow in, firm out, and reduced-motion collapses all of it to instant.

**Key Characteristics:**
- Hanji ground everywhere, with a multiplied paper texture at about 26% over flat hanji.
- Ink-black serif type in two voices: Noto Serif KR for titles, Gowun Batang for reading.
- Vertical writing for titles, slips, ledger numbers and the brand line.
- Physical 3D books built from CSS planes (back board, fore-edge, top edge, page, hinged cover).
- Vermilion as seal and binding, never as surface.
- Square corners; the only circles are the pager buttons.

## Colors

Paper, ink and a few mineral pigments; the palette reads like a page from a bound book under daylight.

### Primary
- **Juhong Seal Vermilion** (juhong-seal): the seal colour. Fills the 入 enter seal, the 落款 stamp in the room, the tiny 반닫이 seal on the open spread, active layer seals, and the focus ring. Also answers hover on ink underlines (masthead link, enter label, colophon links). Never a background, never a panel fill.
- **Seal Paper** (seal-paper): the carved-out character colour inside vermilion seals, and the inner keyline that makes a seal read as stamped rather than a button.

### Secondary
- **Binding Thread** (thread-deep to thread-bright): a four-stop red gradient that gives the 오침 thread its round, twisted look. Belongs to the binding only.
- **Gardenia Cover** (gardenia-cover): book covers, blended soft-light with the 능화문 diamond texture. **Cover Board** (cover-board) is the back board; **Blank Cover** (blank-cover) is the grey-beige of the next, not-yet-bound book.
- **Slip Paper** (slip-paper) and **Page Hanji** (page-hanji): the title slip and the inside pages, slightly lighter and warmer than the ground. **Page Block Line** (page-block-line) stripes the fore-edge and top edge with 1.4px leaves.

### Tertiary
- **Dancheong Layer Tones** (layer-base, layer-frame, layer-brackets, layer-eaves, layer-roof, layer-finishes, layer-ornaments): one pigment per explanatory layer, used only as the small rotated-diamond marker beside a selected layer and in the detail tag. Data colour, not decoration.
- **Plaque Lacquer and Gold** (plaque-lacquer, plaque-gold), ringed in juhong-seal and noerok-green: the 현판 name board in the room header, the one place dancheong framing appears in the chrome.

### Neutral
- **Hanji** (hanji): the ground of shelf, catalog and room; also the theme colour.
- **Hanji Light** (hanji-light): raised paper: the panel (at 85% with an 8px blur), tool buttons (at 80%), inverted text on ink.
- **Ink** (ink): all primary text, 1.5px button and ledger rules, active toggle fill. 13.97:1 on hanji.
- **Ink Soft** (ink-soft): summaries, meta, reading text. 7.74:1 on hanji.
- **Ink Faint** (ink-faint): secondary marks only: ledger numerals, the separator dot, small glosses and labels. About 5:1 on hanji, so it meets the 4.5:1 floor for small text.
- Hairlines are ink at alpha: 13–15% for dividers, 25% for the floor line and pager rings, 40% for underlines and the dotted layer rule.

### Named Rules
**The Seal Rule.** Vermilion marks a seal, the binding thread, focus, or a hover answer on an ink line. If it is filling more than a seal-sized square (about 26–62px), it is wrong.

**The Pigment-Is-Material Rule.** Gardenia, thread red and dancheong tones belong to the objects they describe (cover, binding, layer). They never become UI accents elsewhere.

## Typography

**Display Font:** Noto Serif KR (with Nanum Myeongjo, AppleMyungjo, serif), weights 500/700/900
**Body Font:** Gowun Batang (with Noto Serif KR, AppleMyungjo, serif), weights 400/700

**Character:** A heavy, carved Myeongjo for hanja titles that reads like a printed title slip, paired with a softer brush-born Batang for reading. No sans-serif anywhere.

### Hierarchy
- **Display** (900, clamp(34px, 3.6vw, 56px), 1): the hanja name in the shelf caption (勤政殿), paired with the Korean name at 500, clamp(15px, 1.3vw, 19px), on the same baseline.
- **Display Vertical** (900, clamp(56px, 7vw, 112px), 1, 0.12em): the drafting title set vertically beside the ink plates; becomes horizontal 48px on narrow screens.
- **Headline** (900, clamp(46px, 6vw, 80px), vertical): catalog head (記錄) and ledger record names at clamp(34px, 3.6vw, 48px).
- **Title** (900, 20px, 0.24em): panel heading (일곱 켜); the vertical layer-detail heading uses 900 at 26px.
- **Title Item** (700, 15.5px): layer names in the reading panel.
- **Body Lead** (400, clamp(15px, 1.4vw, 18px), line-height 2, max 34em): catalog introduction.
- **Body** (400, 14.5px, 1.85–1.9, max 40ch in the caption): summaries and layer descriptions.
- **Label** (400, 12–13.5px, 0.06–0.2em tracking): meta lines, tool buttons, colophon, hints. Spaced, never uppercase (there is no Latin display text to case).
- **Numeral** (700, 17px, 0.08em): 第一卷 in the pager; slip sizes scale with the book (title at 8.2% of book width, place at 3.8%).

### Named Rules
**The Vertical Title Rule.** Hanja titles, the brand line, ledger numerals and slip text run vertical-rl, as a bound book would set them. Running text stays horizontal.

**The Two Voices Rule.** Noto Serif KR names things; Gowun Batang explains them. Do not set a paragraph in the display face or a title in the body face.

## Layout

The shelf is a full-viewport stage (100svh, min 600px) with the book track centred at 41% height on a hairline floor. Book height is min(46svh, 430px, 62vw), width 0.7 of height, thickness 5.5% of height; books sit a shelf gap apart and the track translates so the active book is centred. Chrome sits in the four corners at the edge inset: mark top-left, catalog link top-right, caption bottom-left (max min(560px, 58vw)), pager bottom-right. Below the fold, the catalog is a 1180px column: a two-column head (vertical 記錄 beside the lead), a ruled ledger of records (64px numeral column, figure, body), and a three-column colophon.

The room is fixed full-screen. Header across the top at the room inset, the reading panel on the right (clamp(300px, 25vw, 380px), top clamp(84px, 11svh, 104px)), tools bottom-left; the 3D stage owns everything else.

Under 760px: book height becomes min(42svh, 64vw) with a 24px gap; the pager moves to the top-right and the masthead link and vertical brand line hide; the caption spans the width. In the room the panel becomes a bottom sheet (min(42svh, 380px)) and layers become a horizontal scrolling row of seal chips.

## Elevation & Depth

Depth is physical, not material-design. Books are real 3D objects (perspective 1500px, origin 50% 30%, preserve-3d), and inactive books recede in Z rather than gaining or losing shadow. Shadows are the ones paper and boards cast: a soft contact shadow under each book, a gutter darkening on page and inside cover, inset keylines on the cover. The room panel is translucent hanji with a blur, framed by insets rather than a drop shadow.

### Shadow Vocabulary
- **Book board** (`box-shadow: 0 30px 50px -30px #2a1d1080`): under the back board.
- **Contact shadow** (`radial-gradient(closest-side, #2a1d1055, transparent)` ellipse 16px tall, plus a 4px blurred line): where the book meets the floor; fades out when the book opens.
- **Gutter** (`linear-gradient(270deg, #5a46281f, transparent 14%)`): page darkening at the binding.
- **Cover press** (`inset 0 0 0 1px #6b52284d, inset -2px 0 0 #6b522866, inset 0 0 40px #5a3f1a33`): board edges and pressed centre.
- **Panel frame** (`inset 0 0 0 1px #1d1a1622, inset 0 0 0 5px #f7f1e4, inset 0 0 0 6px #b8432b55`): a mounted-paper double rule with a faint vermilion line.
- **Error dialog** (`inset 0 0 0 1.5px ink, 0 20px 50px #0003`): the only lifted surface.

### Named Rules
**The Paper-Casts-Paper Rule.** Every shadow must be one a physical book or sheet would cast. No floating cards, no glow.

## Shapes

Square paper. Covers, slips, seals, panels, buttons and ledger rows have no radius. Two exceptions are native: the binding thread and its stitch ends (2px, plus 3px rounded ends and stitch-hole rings) and the pager buttons, which are full circles with a 1px ink ring. Selected layers are marked by a 6–7px square rotated 45° (a diamond), echoing the 능화문 cover pattern. The 落款 seal arrives oversized and rotated (scale 1.8, −8°) and settles at −4° with a mottled radial mask so it reads as a stamp.

## Components

### Seal Button (入, enter)
Tactile and ceremonial: a 42px vermilion square with a seal-paper keyline carved 2–4px inside, holding 入 in Display 900 at 21px, followed by an ink label with a 1px underline. Hover rotates the seal −6° and scales it 1.07 on a springy out-curve (0.45s, cubic-bezier(.16,1,.3,1)) while the underline turns vermilion. Appears in the shelf caption and on each ledger record.

### Ink Buttons (책 덮고 나가기, 처음 시점, 기록 열기)
- **Shape:** square, 1.5px ink border.
- **Default:** hanji-light at 80% (room) or transparent (catalog), ink label, 0.1–0.14em tracking.
- **Hover:** inverts to ink fill with hanji-light text over 0.2–0.25s.

### Pager
Two 46px circular buttons (38px on mobile) with 1px ink rings at 25% and 1.4px stroked chevrons, around a centred volume count (第一卷 / 전 1권). Hover firms the ring to full ink and adds a 4% ink wash; the disabled end drops to 30% opacity.

### Book (shelf item)
A CSS-built 선장본: back board, ribbed fore-edge and top edge, hanji page, and a cover hinged on its right edge. The cover carries the title slip (left 9%, 23% wide, 54% tall, seal-paper keyline) and the five-hole thread on the right 11%. The blank next book has a slip with no text and a greyed cover. The inside cover and page each hold half of the model-rendered ink elevation, multiplied into the paper, so the spread reads as one drawing across the gutter; the hanja title and a tiny 반닫이 seal sit at the right.

### Room Panel (일곱 켜)
Translucent mounted hanji on the right. Heading plus a two-state mode toggle (온채 / 홑겹: 1.5px ink frame, active segment filled ink). Seven layer rows separated by dotted ink rules, each a 26px outlined vermilion seal with a hanja numeral, the Korean layer name, and a small English gloss; the active row fills its seal and pops a diamond in its dancheong tone. Below, a 2px ink rule opens the detail: vertical heading with a filled seal, gloss, body, and a diamond-marked tag. Details rise in (8px, 0.55s) when they change.

### Plaque (현판)
The building's name board in the room header: hanja right-to-left on black lacquer in gold, ringed vermilion, noerok green and pale hanji like painted dancheong framing.

### Ledger Record
Catalog entry between 1.5px ink rules: vertical numeral column with a hairline, the ink elevation multiplied onto the page, name, summary, a two-column definition grid with hairline-topped cells, and the seal button. The trailing blank record is a short faint row.

### Motion Grammar
- Shelf easing cubic-bezier(.65,0,.2,1): track slides 1.05s; tilt and cover angle animate through registered `@property --tilt` and `--open` (angles, inherited), so the cover swings on its binding rather than cross-fading.
- Shelf: an endless ring placed per frame from each book's distance to the shelf position (x = distance × 1.32 book widths, depth −220px, tilt 16°→26°, opacity fading toward the ring seam); drag and horizontal swipes follow the finger, release settles on the nearest book with momentum (exponential approach, rate 7.5/s).
- Rest: inactive book tilted 26°, active 16° (showing the fore-edge); hovering the active book lifts the cover toward the viewer to 17°.
- Open: cover to 180° (swinging toward the viewer), tilt to 0°, book shifts half a width so the spread centres; cover faces swap at 0.55s and the drawing appears only once the book is open; then the slot dives (scale 3.3 from 50% 64%, 1.5s, cubic-bezier(.75,0,.3,1)) into the room.
- Wake: books rise 40px in, staggered 0.16s each; caption lines rise 8px, staggered 0.06s.
- Room: ink plates are revealed bottom-up by a gradient mask driven by `--r`; the seal stamps (0.28s ease-in); the drawing fades over 2s as the stage fades in over 1.3s; chrome follows (header, panel +0.15s, tools +0.45s).
- `prefers-reduced-motion: reduce` makes every transition and animation effectively instant.

## Do's and Don'ts

### Do:
- **Do** put every building in a book: gardenia 능화문 cover, vertical hanja title slip, five-stitch red thread on the right edge, visible page block.
- **Do** keep one blank book at the end of the shelf so the collection reads as growing.
- **Do** keep the ground hanji with the paper texture multiplied at about 26%; multiply ink drawings into it rather than placing them on white.
- **Do** set titles in Noto Serif KR 900 and reading text in Gowun Batang, vertical where a bound book would be.
- **Do** use the 1.5px vermilion focus outline (offset 5px, 10px on the active cover) for every focusable element.
- **Do** animate opening through the registered angle properties and honour reduced motion.

### Don't:
- **Don't** use vermilion as a panel, page or button fill beyond seal size (The Seal Rule).
- **Don't** draw a literal hanok facade (SVG eaves, lattice doors) or lay buildings out as a web card carousel.
- **Don't** round paper: covers, slips, panels and buttons stay square; circles are for the pager only.
- **Don't** introduce a sans-serif or a second display face.
- **Don't** go lighter than Ink Faint for small reading text; it sits just above the 4.5:1 floor on hanji.
- **Don't** use dancheong layer tones outside the layer markers and the plaque.
