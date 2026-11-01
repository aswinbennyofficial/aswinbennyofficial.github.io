---
name: Aswin Benny
description: A Western Ghats trek in one page; forest-department signage on trail-dark ground.
colors:
  board: "#1e4a35"
  mustard: "#e9b23c"
  rust: "#b03f24"
  rust-ink: "#e0694c"
  ground: "#1c1a16"
  ground-2: "#26231d"
  paint: "#f4efe2"
  stone: "#b9b1a1"
  line: "#4a443a"
  post-wood: "#5b4a35"
  rim: "#3a342b"
  panel: "rgba(20,19,16,.88)"
typography:
  display:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "46px"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(2.6rem, 6vw, 4.4rem)"
    fontWeight: 800
    lineHeight: 0.95
  title:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(24px, 2.6vw, 30px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "0.02em"
  sign:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(26px, 3.4vw, 36px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.03em"
  button:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.06em"
  stencil:
    fontFamily: "Big Shoulders Stencil Display, Big Shoulders Display, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.06em"
  value:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "26px"
    fontWeight: 900
    lineHeight: 1
  label:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.14em"
  lead:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "clamp(20px, 2.2vw, 24px)"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  none: "0"
  round: "50%"
spacing:
  trail-x: "clamp(18px, 4vw, 56px)"
  board-pad: "clamp(24px, 4vw, 48px)"
  block: "44px"
  stop: "clamp(80px, 11vw, 140px)"
  page: "min(1100px, 100% - 32px)"
components:
  button-primary:
    backgroundColor: "{colors.rust}"
    textColor: "{colors.paint}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "14px 22px"
  button-primary-hover:
    backgroundColor: "{colors.board}"
    textColor: "{colors.paint}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.paint}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "14px 22px"
  button-quiet-hover:
    textColor: "{colors.mustard}"
  arrow-plate:
    backgroundColor: "{colors.board}"
    textColor: "{colors.paint}"
    rounded: "{rounded.none}"
    padding: "14px 36px 14px 20px"
  arrow-plate-mustard:
    backgroundColor: "{colors.mustard}"
    textColor: "{colors.ground}"
  arrow-plate-rust:
    backgroundColor: "{colors.rust}"
    textColor: "{colors.paint}"
  enamel-board:
    backgroundColor: "{colors.board}"
    textColor: "{colors.paint}"
    rounded: "{rounded.none}"
    padding: "{spacing.board-pad}"
  wayside-sign:
    backgroundColor: "{colors.board}"
    textColor: "{colors.paint}"
    rounded: "{rounded.none}"
    padding: "22px 22px 20px"
  checkpoint-stamp:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.rust-ink}"
    typography: "{typography.stencil}"
    rounded: "{rounded.round}"
    size: "84px"
  hud-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.paint}"
    typography: "{typography.value}"
    rounded: "{rounded.none}"
    padding: "8px 14px"
  game-dialog:
    backgroundColor: "{colors.paint}"
    textColor: "{colors.ground}"
    rounded: "{rounded.none}"
    padding: "16px 20px 14px"
    width: "min(760px, 100% - 24px)"
  game-dialog-alert:
    backgroundColor: "#2a1410"
    textColor: "{colors.paint}"
  mute-button:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.paint}"
    rounded: "{rounded.none}"
    size: "44px"
  checkpoint-counter:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.stone}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
  notice-card:
    backgroundColor: "{colors.paint}"
    textColor: "{colors.ground}"
    rounded: "{rounded.none}"
    padding: "22px"
    width: "min(560px, 100%)"
  carved-post:
    backgroundColor: "{colors.mustard}"
    textColor: "{colors.ground}"
    typography: "{typography.stencil}"
    width: "96px"
    padding: "18px 0 8px"
---

# Design System: Aswin Benny

## Overview

**Creative North Star: "The Trailhead & Checkpoint Pass"**

The page is a trek through the Western Ghats, told in the material vocabulary of a forest department: enamel green boards with cream hand-painted capitals, mustard and rust arrow plates on a timber post, carved distance posts, rubber checkpoint stamps in rust ink, and a dashed mustard trail line running down warm, near-black loam. Every surface is a physical object you would pass on a path, and the reader moves down the trail line from board to checkpoint to signpost.

The trailhead is a clearing with a small server farm on it, built in CSS 3D: an isometric loam floor with a faint cream grid and a timber rim, racks as five-faced boxes with blinking LED columns, the enamel name board raised as a billboard on two timber legs, and flat-illustrated animals (each in a mustard hard hat) standing as camera-facing billboards with nameplates. Screen-space game UI sits over it in the same vocabulary: dark loam panels with a line border for the HUD, a cream double-framed dialog box for speech. Below it, the trail itself is gently three-dimensional: stops rise into place, signs sway in the wind of a fast scroll and lean toward the pointer, a cyclist rides the trail line with the scroll, and checkpoint stamps flip down as you reach them.

Density is low and the rhythm is long: each stop sits off the trail line with generous vertical travel between them. Type is tall condensed sign-painter capitals for everything that would be painted on a board, and a friendly humanist sans for everything that would be spoken. Objects are slightly hand-planted: signs tilt a degree or three, stamps are struck at an angle, stakes vary in height.

It rejects the hero-plus-cards developer homepage and the terminal costume of the previous version (archived at /v2/).

**Key Characteristics:**
- Dark trail ground, signage carries all the colour.
- Square-cornered painted boards with bolted corners; circles only for stamps and bolts.
- Arrow-plate silhouettes for anything that leads somewhere.
- Condensed uppercase display type on signs; Figtree for prose.
- Soft, downward lift under signage; no rounded cards, no glass, no gradient fills (gradients only shade the bolt heads and light the 3D scene's loam).
- Real CSS 3D for depth: the hero scene is a perspective world; on the trail, 3D is motion only and never hides content.

## Colors

A forest-department palette: one enamel green, two warning-paint accents, cream paint, on warm stone-dark ground.

### Primary
- **Forest Department Enamel** (board): the trailhead board, wayside signs, default arrow plates and signpost signs, and the button hover state. It is the colour of the world's furniture.

### Secondary
- **Mustard Trail Paint** (mustard): the dashed trail line, links, focus outline, selection, carved year posts, and exactly one arrow plate per set (the destination that matters most). Also the text caret.

### Tertiary
- **Rust Plate** (rust): primary buttons, one arrow plate per set, rust wayside signs, the cat's bowl. Holds cream paint text at 5.2:1.
- **Rust Ink** (rust-ink): the light rust used for text and strokes on dark ground: checkpoint stamps, collected badge stamps, warning status, hearts, the full-queue rule.

### Neutral
- **Trail Loam** (ground): page background; also the inner ring fill of stamps and dark text on mustard and cream.
- **Shaded Loam** (ground-2): the one inset yard surface (the cat yard).
- **Board Paint** (paint): primary text, the board's painted border, the cream SuSHi board, speech bubbles.
- **Weathered Stone** (stone): secondary prose on ground (8:1), stat labels, unearned badges.
- **Trail Edge** (line): hairline dividers, footer rule, dashed outline of unearned badges.
- **Post Timber** (post-wood): signpost pole, wayside stakes, the name board's billboard legs, and the scene floor's outer rim. Currently a literal in CSS, not a custom property.
- **Worn Rut** (rim): the darker loam step one below line: the scene floor's inner rim, the cat yard's floor edge, unlit HUD pips and next-secret cells, and a step of the headline extrusion. A literal in CSS.
- **Night Panel** (panel): translucent loam (88%; 92% on the checkpoint counter) for screen-space game UI over the scene and page: HUD cells, mute button, checkpoint counter. Always with a 2px line border; never blurred.

### Scene-only colour
The 3D scene carries its own lighting and signals, which stay inside the scene: rack faces in five loam shades (#1f1c17 to #3d372d, lit top to shaded back), green status LEDs (#6fcf7a), alarm LEDs (#ff5a3c) with the rack top pulsing to a dark rust (#8a2c1a), and a warm loam light pool (#312c23) fading into a darker sky (#141310). The animal illustrations use their own natural fills, unified by a mustard hard hat on every one. The game dialog's alert variant is a deep rust-black (#2a1410) under paint text with a rust-ink outline.

### Named Rules
**The Paint On Signs Rule.** Saturated colour lives only on objects (boards, plates, stamps, posts, buttons, LEDs); the ground itself stays loam. Ground may be lit in loam tones (the scene's light pool) but never tinted with a hue.

**The Two Rusts Rule.** Rust is a fill under cream text; Rust Ink is a stroke or text colour on dark ground. Do not swap them: rust text on loam fails, rust-ink fill under cream fails.

**The One Of Each Rule.** In a set of plates or signs, green is the default; rust and mustard appear once each to break the run.

## Typography

**Display Font:** Big Shoulders Display (with Arial Narrow, sans-serif)
**Stencil Font:** Big Shoulders Stencil Display (with Big Shoulders Display)
**Body Font:** Figtree (with system-ui, sans-serif)

**Character:** Tall condensed sign-painter capitals for anything painted, stamped or carved; a warm, round humanist sans for anything said in first person.

### Hierarchy
- **Display** (900, 46px on the billboard, 0.9): the name on the enamel board only; the base rule is 64px but the board now stands in the scene and scales with it. Uppercase.
- **Headline** (800, clamp(2.6rem, 6vw, 4.4rem), 0.95): one per stop. Uppercase, balanced wrapping, carved extrusion (see Elevation). The notice card's title uses the same face at clamp(34px, 6vw, 46px) with no extrusion.
- **Title** (800, clamp(24px, 2.6vw, 30px), 1.05, 0.02em): timeline entries, project board, wayside sign names (scaled up to 28-38px on signs, 44-64px on the lead sign). Uppercase.
- **Sign** (800, clamp(26px, 3.4vw, 36px), 1, 0.03em): signpost links. Plates use the same face at 800, 22-28px.
- **Button** (800, 20px, 1, 0.06em): button labels. Uppercase.
- **Stencil** (800, 17px on stamps, 30px on year posts, 14px on badges): checkpoint stamps, carved years, badge names. Uppercase.
- **Value** (900, 26px, 1): HUD numbers; cat stats at 28px; the checkpoint counter at 20px. Uppercase.
- **Label** (600, 13px, 0.14em, uppercase): stat terms and plate distances (15px, 0.08em); HUD terms at 12px; the counter's caption at 12px, 0.12em. Speaker names in the dialog and critter nameplates use the same face at 800 (15px 0.12em; 13px 0.08em, counter-scaled so they stay readable when the scene shrinks).
- **Lead** (400, clamp(20px, 2.2vw, 24px), 1.5): the first paragraph of a stop, in paint.
- **Body** (400, 18px; 17px under 520px; 1.65): prose in stone, max 58-62ch.

### Named Rules
**The Painted Caps Rule.** Every display-face string is uppercase. Figtree is never uppercased.

**The Stencil Is For Stamps Rule.** The stencil face marks things that were struck or carved (stamps, year posts, badge names). It never sets headlines or prose.

## Layout

A single column of stops hangs off a vertical trail line. The page container is min(1100px, 100% - 32px). The trail line runs at `trail-x` from the column's left edge as a 4px dashed mustard rule at 55% opacity; each stop's content is indented past it by clamp(40px, 6vw, 88px) (40px under 520px), and its checkpoint stamp sits centred on the line at the stop's top. Stops are separated by `stop` padding; blocks within a stop sit 40-48px apart.

The header is the trailhead: a full-bleed 3D scene clamp(620px, 100svh, 1000px) tall, then the arrow-plate nav as one wrapping row of plates (each flex 1 1 200px) inside the page container, 28-44px below. The scene's world is a 460px square floor scaled to fit the space between the HUD (top centre, 16px) and the dialog box (bottom centre, 20px); the mute button sits top right. Under 520px the plates go full width and flush, the HUD tightens, and the mute button drops below it. The checkpoint counter is fixed bottom-right and slides up once the trail begins.

Wayside signs wrap in a flex row with uneven widths (26-60%) and stakes of different heights so their faces align at the bottom; under 860px they pair up at 50% with the first and last full width; under 520px every sign is full width. The timeline is a 96px post column beside text, collapsing to stacked under 520px. Breakpoints: 860px and 520px; pointer: fine enables the pointer tilt, pointer: coarse hides keyboard badges.

## Elevation & Depth

Depth is physical: signage casts a soft, downward shadow onto the ground as if standing slightly off it, with a thin 2px edge suggesting board thickness. The ground and the inset yard are flat. Clipped shapes (arrow plates) take their shadow through a drop-shadow filter because clip-path cuts box-shadow. The hero adds real perspective: the scene is a 3D world (perspective 1500px) with true boxes and billboards, and the trail beneath has a shallower perspective (1200px) used only for motion.

### Shadow Vocabulary
- **Board lift** (`box-shadow: 0 2px 0 rgba(0,0,0,.25), 0 18px 40px -18px rgba(0,0,0,.7)`): the trailhead board and the cream project board.
- **Sign lift** (`box-shadow: 0 2px 0 rgba(0,0,0,.25), 0 16px 30px -16px rgba(0,0,0,.7)`): wayside sign faces.
- **Plate drop** (`filter: drop-shadow(0 10px 14px rgba(0,0,0,.45))`): arrow plates in the nav.
- **Stamp ring** (`box-shadow: inset 0 0 0 4px <ground>, inset 0 0 0 5px <rust-ink>`): the inner second ring of a rubber stamp, with a 3px outer border.
- **Stake bevel** (`box-shadow: inset -3px 0 0 rgba(0,0,0,.25)`): shaded side of a wayside stake.
- **Carved extrusion** (`text-shadow: 1px 1px 0 #4a443a, 2px 2px 0 #3a342b, 3px 3px 0 #2c2822, 4px 4px 0 #24211c, 6px 8px 12px rgba(0,0,0,.45)`): stop headlines only, stepping down through the loam neutrals so painted letters read as cut to depth.
- **Panel drop** (`box-shadow: 0 20px 40px -14px rgba(0,0,0,.8)`): the game dialog; the notice card takes a larger 0 30px 60px -20px.
- **Figure drop** (`filter: drop-shadow(0 6px 4px rgba(0,0,0,.45))`): animals and the rider, as figures standing on the ground.
- **Floor rim** (`box-shadow: 0 0 0 10px <rim>, 0 0 0 12px <post-wood>, 0 0 80px 30px rgba(0,0,0,.6)`): the scene floor's timber edge and the dark falloff around it.

### Named Rules
**The Standing Sign Rule.** Shadows fall down, never sideways, and only under objects that stand on the trail. No sign hovers on a halo. The carved extrusion is the one stepped shadow, and it belongs to headline lettering, never to a box.

**The Motion-Only 3D Rule.** On the trail, 3D transforms (rise, sway, tilt, stamp flip) animate content that is already visible; nothing waits on an observer or a 3D state to be readable, and all of it is skipped under prefers-reduced-motion.

## Shapes

Boards and plates are square-cornered (0 radius). Their character comes from silhouette and hardware instead: arrow plates and signpost signs are clipped to a right-pointing arrow (a 22-24px point); year posts are clipped to a carved peaked top (12px shoulders); boards carry two round bolts in the top corners (8-10px, a grey radial gradient, darker brown on mustard). The trailhead board is double-framed: 6px painted cream border inside a 4px green outline. Circles (50%) are reserved for stamps, badges, bolts, and the checkpoint counter's marks. Game UI panels, the dialog, the mute button and the notice card are square-cornered like everything else. Signs and stamps are planted at small angles: wayside faces at -1.2deg and 1.4deg alternating, signpost signs between -3deg and 3deg, stamps at -12deg (collected badges -8deg and 6deg).

## Components

### Buttons
Painted, flat, and blunt.
- **Shape:** square corners (0).
- **Primary:** rust fill with cream button type, 14px 22px; an optional arrow or fish SVG at 28x16 in mustard leads the label.
- **Hover / Focus:** fills to enamel green and lifts 2px (0.3s on the trail ease); presses down 1px on active. Focus is the global 3px mustard outline at 4px offset.
- **Quiet:** transparent with a 2px inset ring in currentColor; hover turns text and ring mustard (on the cream board it stays ground).

### Arrow Plates (navigation)
The nav is a row of arrow plates under the scene, wrapping on narrow screens. Each plate is a three-column grid: label (800, uppercase), distance in km (label style), arrow SVG. Default green, one rust, one mustard. Hover slides the plate 8px along the direction it points (0.35s, trail ease). The stacked-on-a-post arrangement (staggered 0-30px offsets on a 14px timber post) remains in the stylesheet as the base plate layout but is not used on the page.

### Enamel Board
Green field, 6px cream border, 4px green outline, two corner bolts, board lift, padding `board-pad`. In the hero it stands in the scene as a 320px billboard (16px 20px padding, centred text) on two 14px timber legs, always turned to face the camera. The cream variant (project board) inverts to paint field and ground text with darker bolts and wraps its actions to the right.

### Server Farm Scene (signature)
A CSS-3D world tilted 58deg and turned -38deg, eased between camera states over 0.9s; a mouse nudges the turn by up to 12deg either way and touch drags it. Racks are 70 x 44 x 120 boxes whose front and side faces carry stepping LED columns (1.6s and 2.3s, steps(2)); an alarmed rack turns its LEDs red and pulses its top, a downed rack goes dark. Animals are buttons standing as billboards: hover lifts the figure 8px, the speaking one lifts 14px and grows 12% while the others dim to 55%; a right answer hops, a wrong one swats. Each has a nameplate in night-panel loam that turns mustard while speaking, with a cream keyboard badge (1-7) shown only during play on fine pointers.

### HUD
Night-panel cells (2px line border, 8px 14px, min 84px) in a centred row: label term over value number. Lives are rust-ink server pips (unlit in rim); the next-secret bar is three 22 x 12 cells that light mustard. The score bumps to 1.3x in mustard on gain.

### Game Dialog
A cream speech box at the scene's foot: paint field, 4px ground border, 3px paint outline (the board's double frame, inverted), panel drop. Speaker in rust label caps, line in Figtree at clamp(17px, 1.8vw, 20px)/1.45, a quieter note (#6b5f4c; rust and 600 when bad), an 8px timer bar that drains in mustard, and buttons at 18px 11px 18px. The alert variant inverts to rust-black with a rust-ink outline, speaker and timer, and stone notes.

### Mute Button
A single 44px night-panel square, top right of the scene, with a speaker glyph drawn in SVG; when pressed its sound waves vanish and it dims to stone. One switch governs every synthesised sound on the page (the game's beeps, the cat's meow and purr) and is remembered across visits.

### Checkpoint Counter
Fixed bottom-right: a night panel (2px line border, 10px 12px) with a label caption over a value, beside one 26px dashed line circle per stop. Reaching a stop stamps its circle in rust-ink with a centre dot (the stamp-down entrance) and flips the stop's own checkpoint stamp.

### Notice Card
A modal card over a 72% loam scrim: paint field, 4px ground border, 3px paint outline, max 560px, 22px padding, entering with a 0.5s perspective tip-in. Inside, a board-green panel with mustard trace lines holds dashed cream drop slots that turn mustard on hover and solid mustard when filled (a wrong drop shakes in rust); below, a four-column tray of pale cream part tiles (#e7dfcd) that rise 3px with a rust border when picked. A quiet underlined text button always dismisses it.

### Rider
A small flat-illustrated cyclist (96 x 69, 54 x 39 under 520px) rotated to travel down the trail line, its position bound to the scroll, with a figure drop.

### Wayside Signs
Interest signs as small green, mustard or rust faces on 12px timber stakes of varying height (18-64px), tilted alternately, with corner bolts and sign lift. Title in display caps, one short Figtree line under it.

### Checkpoint Stamp
An 84px (62px under 520px) circle on the trail line at each stop's head: 3px rust-ink border, inner second ring, ground fill, stencil word, rotated -12deg. Decorative and aria-hidden; one per stop.

### Carved Year Post
A 96px mustard post with a peaked top and a stencil year in ground, beside each timeline entry.

### Signpost
Outbound links as arrow-clipped signs (sign type, 14px 44px 14px 22px) on a timber pole, each tilted and staggered, green with one rust and one mustard. Hover straightens the sign and slides it 10px along its arrow.

### Cat Yard (signature)
The one interactive toy: an inset ground-2 yard with a 2px line border and a 6px darker floor edge. A dashed floor rule carries the fish queue into the cat's bowl; fish are stone silhouettes (golden fish in mustard with a soft glow), empty slots are dashed ovals, and the full queue turns the rule rust-ink and jostles. Speech bubbles are cream with a pointer, in display caps. Stats are a four-column definition list (two under 520px) of label terms over 28px value numbers. Collected stamps reuse the checkpoint stamp language: dashed line-coloured circles until earned, then rust-ink double rings struck at an angle with a scale-down entrance.

### Motion
One ease for everything that moves an object: cubic-bezier(.16, 1, .3, 1), 0.3-0.5s for small objects and 0.6-0.9s for the camera, rising stops, swaying signs and the stamp flip. Opacity changes take 0.2s. Pointer tilt follows at 0.25s ease-out (up to 10deg on boards, signs and the yard). Idle loops (tail, blink, sleep, LEDs) are slow and small. Under prefers-reduced-motion, all animation and transition is removed and the scripted tilt, sway, camera drift and stamp flip are never attached.

## Do's and Don'ts

### Do:
- **Do** make every new surface an object you could pass on a trail: an enamel board, a plate, a post, a stamp, a stake.
- **Do** keep boards square-cornered and give them corner bolts and the board or sign lift.
- **Do** use the arrow-plate silhouette for anything that navigates or links out, and slide it along its arrow on hover.
- **Do** set every display-face string in uppercase Big Shoulders; set prose in Figtree at 18px/1.65 in stone, with the lead in paint.
- **Do** use rust as a fill under cream and rust-ink as a stroke or text on ground.
- **Do** keep focus visible as the 3px mustard outline at 4px offset, and honour prefers-reduced-motion.
- **Do** put screen-space game UI on night panels (88% loam, 2px line border, square) and speech on the cream double-framed dialog.
- **Do** keep 3D on the trail motion-only: content is readable before and without any transform.

### Don't:
- **Don't** use rounded rectangles or rounded cards; the only curves are full circles for stamps, badges and bolts.
- **Don't** tint section backgrounds or put colour on the ground; colour belongs to signage.
- **Don't** cast shadows sideways or add ambient glows to boards and signs; lift is downward only. The single glow in the system marks a golden fish in the cat game.
- **Don't** reintroduce terminal styling, monospace costume, or the hero-plus-cards developer layout.
- **Don't** use the stencil face for headlines or body text.
- **Don't** use more than one rust and one mustard in a set of plates or signs.
