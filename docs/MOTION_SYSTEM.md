# Motion system: Decision Universe

This is the phase 17 motion bible. It pairs with `VISUAL_DESIGN.md`, and all references point there:

- scene ids S00-S08 and THE LAB
- geometry states G0 (giant), G1 (aside), G2 (scene), PAIR, FALL and G5 (lab)
- interaction numbers 1-14

Every value here is binding for the frontend engineer. A deviation needs a written reason in `docs/ENGINEERING_DECISIONS.md` (the orchestrator owns that file).
Author: Creative Director (task P10-CD-001), 2026-10-11.

## Contents

1. [Global principles and the six motion layers](#1-global-principles-and-the-six-motion-layers)
2. [Hard rules](#2-hard-rules)
3. [Token mapping](#3-token-mapping)
4. [The scroll engine and the thread transition model](#4-the-scroll-engine-and-the-thread-transition-model)
5. [Animation specifications](#5-animation-specifications)
6. [Navigation, chapter jumps, interruption](#6-navigation-chapter-jumps-interruption)
7. [Operational state motion](#7-operational-state-motion)
8. [Reduced motion](#8-reduced-motion)
9. [Performance budgets and rendering](#9-performance-budgets-and-rendering)
10. [Technical stack recommendation](#10-technical-stack-recommendation)
11. [Motion test plan](#11-motion-test-plan)

---

## 1. Global principles and the six motion layers

1. **Motion performs the analysis. Nothing moves to decorate.**

   | Motion | Operation |
   |---|---|
   | Threads **grow outward**, one year per beat | time passing after the decision |
   | Threads **re-wind** (change angle at fixed radius), keyed by draw index | the same worlds under another decision (common random numbers) |
   | A payback square **appears** on the 12 o'clock ray | a future completing its turn: money back |
   | Threads **multiply** (more appear, none move) | more Monte Carlo draws (S03a) |
   | The Turn **unrolls** into the waterfall | polar to cartesian, the same threads; time becomes downward |
   | A belief band **narrows** down the column | a conjugate update with one more observation |
   | Applicant hairlines **dim** as the threshold passes them | the decision rule rejecting them |
   | A Pareto point **lands** | a completed live LP solve |
   | Replicate ticks **gather** around the analytic value | Sobol estimates converging with N |
   | Estimator rows **slide** toward or away from the benchmark line | switching sample or estimator |

2. **Out, round, down. Never spin.** Threads extend outward (time), wind in angle per thread (money), or fall downward (the Unroll). The Turn as a body never rotates; no global rotation transform exists. Nothing travels along a thread; nothing pulses; no particles.
3. **Two motion modes,** from the reference:
   - **Scrubbed** (a pure function of scroll progress, stateless, reversible): G-state camera moves, the Unroll, card decks, word reveals, the S01 statement.
   - **Stepped** (a threshold triggers a timed, retargetable transition): the S00 beats (timed), S01 decisions, S03a n steps, S03b updates, S05b applicant choice, S06 steps, S07 argument cards, the S08 echo.
4. **Data is shown only at real states.** Every decision, n, observation count, threshold, epsilon, N, estimator on screen is a published record or a completed browser computation. A re-wind interpolates each thread's **recovered share per year** between two real paths of the same world; while it runs, no readout shows an in-between value (ledgers swap on landing, numerals tween 600ms between the two real values in a fixed `ch` box) and the thread inspector is disabled.
5. **Status before shape.** On a live compute, `RUNNING IN YOUR BROWSER · SEED · ms` appears first (200ms), then geometry moves when the worker returns. Parity `MATCH`/`MISMATCH` appears 200ms after landing.
6. **One luminous form at a time.** S00, S01, S03a, S08: the Turn. S02, S03b: the Turn at 20% behind cards or the belief column. S04: the waterfall. S05, S06, S07: the scene's own lit marks with the Turn at 12% as a backdrop (G1). THE LAB: the Turn at G5.
7. **Slow structure, quick data.** Camera moves 800-1200ms or scrubbed; re-winds 1200ms on scroll steps, 800ms on control changes; crossfades 200ms; numerals 600ms.
8. **Keyed continuity.** Threads by draw index; payback squares by draw index; applicant hairlines by test row; Pareto points by epsilon index; replicate ticks by replicate seed; estimator rows by estimator id; belief steps by observation index.
9. **Settle, don't bounce.** No overshoot on data marks. Springs (damping ratio ≥ 1.0) only on the LAB bottom sheet.
10. **The visitor always wins.** Any input retargets or completes an animation immediately. A computation never blocks scroll; a newer request cancels an older one in the worker (by request id).

### The six motion layers (directive requirement)

| Layer | Where it lives | Spec |
|---|---|---|
| 1. Intro | S00 The First Turn: the decision square, eight growth beats, payback squares, glow, headline, nav | 5.1 |
| 2. Navigation transitions | Bottom bar active block, MENU pill, chapter jumps with a stage fade, focus moves | 6 |
| 3. Scroll storytelling | G-state moves, S01 re-wind, S02 deck, S03a multiply, S03b narrowing, the Unroll, S05/S06/S07 steps, the echo | 4, 5.2-5.12 |
| 4. Component interaction | Decision radio, steppers, SUCCESS/FAILURE, threshold handle, cost slider, epsilon slider, seed field, applicant cards, inspector | 5.13 |
| 5. Data transitions | Re-winds, thread multiply, band narrowing, dimming, point landing, tick gathering, row sliding, numerals, status swaps | 5.3-5.11 |
| 6. Microinteractions | Hover/press/focus on chips and squares, the u32 ✓ ticks, parity MATCH, tooltips, RESET confirm, elapsed-ms counters | 5.13, 7 |

## 2. Hard rules

| Rule | Test |
|---|---|
| **LCP:** `h1[data-hero]` is in the HTML from first paint as ghost text (opacity 0.55, blur 12px, ED #10), never opacity 0; display font preloaded with a metric-matched fallback; WebGL2 context and the worker are created after first paint (`requestIdleCallback`, 300ms timeout) | Lighthouse: LCP element `h1[data-hero]`, LCP ≤ 2.5s, CLS ≤ 0.1, mobile and desktop presets |
| **Nothing heavy on the LCP path.** First paint needs `meta.json` and `facts.json` only (about 7 KB raw). The hero's threads are **generated in the worker from the seed** (no thread data is downloaded); `m03_montecarlo.json` (4.4 KB) loads with the worker for parity. Other module artifacts load at their scene; HiGHS-wasm at S06 | Waterfall: no other request before FCP; no `.wasm` before S06 without a deep link |
| **Thread rule.** At every rest state, each drawn thread's vertex k equals the polar map of the worker's `recovered` for that draw index (1e-4 px), colour equals sign(NPV), and the payback squares equal the threads with recovered ≥ 1 by year 8 (exact count) | Debug hook reading back the instance buffer at the S00 end, each S01 decision, each S03a n and the LAB default |
| **Common random numbers.** For a fixed seed and draw index, the five input draws are identical across decisions | Worker unit test plus a Playwright read of the inspector for 5 indices under 3 decisions |
| **No value in transit.** During a re-wind or the Unroll, ledgers hold the old or the new record only; the inspector is disabled | Playwright samples 10 frames of a re-wind |
| **Never spin.** No rotation of the Turn as a body; the only angular quantity is each thread's recovered share | Grep for `rotate(` and rotation matrices in `src/turn`; shader review |
| DOM animates only `transform`, `opacity`, `filter` (at most 14 word spans at once); never layout properties or `backdrop-filter` | Trace: no Layout events in scrubbed frames |
| **One `requestAnimationFrame` loop** owns Lenis, progress, tweens and both canvases | One call site (`src/motion/loop.ts`) |
| **Compute never blocks.** All ten modules and the PRNG run in `compute.worker`; HiGHS in its own worker; results come back as transferable `Float32Array`s | Long-task trace during S01 re-wind, S03a n = 20,000 and an S06 solve: no main-thread task over 50ms attributable to compute |
| **Draw only when dirty.** The WebGL canvas redraws only when progress, a uniform, the camera or the tier changed; a static Turn costs zero frames | Playwright: with S05 centred and idle, the WebGL frame counter is flat for 2s |
| No artificial delays, no fake progress. Computing shows real elapsed ms | Code review: no `setTimeout` gating data |

## 3. Token mapping

| Token | Value | Used for |
|---|---|---|
| `--motion-fast` | 200ms | Nav hover, tooltips, status swaps, parity marks, chip swaps, the u32 ✓ ticks (each), pill label swap |
| `--motion-standard` | 350ms | Argument stack, intro completion on input, chapter-jump stage fade, segmented active block, applicant dimming, inspector exit |
| `--motion-panel` | 600ms | Numeral tweens, belief band narrowing per update, Pareto point landing, replicate ticks gathering, estimator row slide, data entering after load |
| `--motion-card` | 800ms | Story-card settle, G-state moves on a jump, **control-driven re-winds**, the S08 replay settle |
| `--motion-scene` | 1200ms | **Scroll-step re-winds** (S01), S03a multiply, the reference's `transform 1.2s cubic-bezier(.33,1,.68,1)` |
| `--ease-premium` `cubic-bezier(.5,0,0,1)` | | Entrances: cards, nav, inspector, the decision square, threads appearing in S03a |
| `--ease-symmetric` `cubic-bezier(.5,0,.5,1)` | | Every scrubbed interpolation (camera, the Unroll), each S00 growth beat |
| `--ease-smooth` `cubic-bezier(.33,1,.68,1)` | | Stepped settles: re-winds, band narrowing, point landing, numerals, word sharpening |
| `linear` | | Story progress segments, elapsed-ms counters, loading percentages |
| `ease-in-out` | | Nav hover only (matches the reference) |

| Directive category | Directive range (ms) | Our value (ms) |
|---|---|---|
| Hover | 120-250 | 120-200 |
| Buttons | 150-300 | 200-350 |
| Panels | 250-600 | 350-600 |
| Charts | 400-1000 | 600-800 |
| Section transitions | 700-1800 | 800-1200 |
| Cinematic | 1000-3000 | 1200-1600, plus the 4.8s composite intro |

## 4. The scroll engine and the thread transition model

Reuse the app shell already ported through P01-P07 (`site/src/motion`, `scroll`, the loader, the nav, the viewport-class fix of ED #39). Do not rebuild it.

**Scroll engine.** Tracks per VISUAL_DESIGN 3.1, a sticky `100dvh` stage, `p = clamp((scrollY - trackTop) / (trackHeight - innerHeight), 0, 1)` from Lenis, geometry re-measured on resize. Active set: the scene at the viewport centre and the next. Scrubbed `s = ease((p - a)/(b - a))` clamped; stepped thresholds with hysteresis ±0.02. Lenis `lerp 0.1` on D; native touch scroll on T/M; off under reduced motion.

**The thread transition model** (`src/turn/`):

- **Instance data** (from the worker, one `Float32Array` per decision): per thread, `recovered[0..8]` (9 floats), `npv` (1), `index` (1) = 11 floats. 12,000 threads = 528 KB per decision. Two decision slots (`A`, `B`) are resident; a third is swapped in on demand.
- **Geometry.** One static vertex buffer of 97 sample positions `u = 0..96` (8 years x 12 + 1). Drawn as `gl.LINES` with 192 vertices per instance (96 segments) by `drawArraysInstanced(LINES, 0, 192, N)`. The vertex shader computes, for sample `u`: `t = u / 12`; `f = mix(recovered[floor t], recovered[ceil t], fract t)` from the active slot, mixed with slot B by `u_rewind`; `θ = 2π f`; polar position `c + R (t/8) (sin θ, -cos θ)`; cartesian (FALL) position `(x0 + W f / 1.8, y0 + H t / 8)`; final = `mix(polar, fall, u_unroll)`; clipped by `u_years` (growth: samples with `t > u_years` are discarded).
- **Every animation is a uniform:** `u_years` (0..8, growth), `u_rewind` (0..1, decision A to B), `u_unroll` (0..1), `u_count` (instances drawn, S03a), camera `u_c`, `u_R`. Nothing is re-uploaded per frame. A decision change uploads one new slot (once), then animates `u_rewind`.
- **Retargeting.** On a new decision mid-re-wind, the current blend becomes the new start: the worker already holds both paths, so the main thread uploads `mix(A, B, e)` (computed in the worker, 2ms for 12,000 threads) as the new A and starts from `u_rewind = 0`. No queue.
- **Payback squares** (Canvas2D overlay): radii come from the worker's `payback_year` per thread; they appear when `u_years` passes them; under a re-wind they crossfade (200ms) at landing, never slide (an in-between payback year would be a value no world has).
- **The glow** is a second pass: the same draw into a 1/4-resolution framebuffer, a separable 24px Gaussian blur, composited with `screen` at 40% tinted `#690DE2`. It is redrawn only when the Turn is dirty, and skipped on LOW.

## 5. Animation specifications

Format: **Trigger · Initial → End · Duration / Easing · Sync · Interruption · Input · Reduced motion · Performance.**

### 5.1 S00 intro: "The First Turn" (4.8s total)

| t (ms) | Event | Duration / easing |
|---|---|---|
| 0 | Black; ghost headline and the `SYNTHETIC · SEEDED` chip already painted (LCP); wordmark top-left | none |
| 150 | SKIP INTRO visible (bottom right), focused | 200 fast |
| 300 | The decision square scales 0 → 1 at G0 `c`; `INVEST {{investment}} M USD?` types in beside it word by word (blur to sharp, 80ms per word) | 350 premium |
| 900 | Worker returns the hero paths (it starts at first paint + idle; if late, beat 1 waits, the label reads `DRAWING {{n}} FUTURES · SEED`). Only now is `· RUNNING IN YOUR BROWSER` appended to the chip (200 fast). If the worker fails or has not answered by 2,500ms, the shared path module runs on the main thread for the LOW-tier 1,200 paths and the chip reads `· RUNNING IN YOUR BROWSER (MAIN THREAD)` | none |
| 1000-3800 | **Eight growth beats**: `u_years` 0 → 1 → ... → 8, 350ms per beat, symmetric ease within each beat; payback squares pop in (200ms) as `u_years` passes them | 8 x 350 |
| 3800 | Glow pass fades 0 → 40% | 600 smooth |
| 3900 | Headline sharpens word by word (ghost → sharp), caption numbers tween from 0 | 600 smooth |
| 4400 | Nav enters from below (12px, opacity) | 350 premium |
| 4800 | `intro: done`; scroll unlocked (it was never locked: any scroll completes the intro) | none |

Interruption: SKIP, Esc, scroll, or any key completes it in 350ms (all uniforms to end values). Reduced motion: end state at first paint after the worker returns; before that, the decision square, headline and chip. Performance: 8 beats draw the full instance count; per-frame cost is the full Turn (9.2).

### 5.2 Word blur reveal (S00 headline, S01 statement, S08 echo, statement swaps)

Words are spans; each goes `opacity .55, blur 12px → 1, 0` over 600ms smooth, staggered 60ms (timed) or mapped to a scroll window (scrubbed in S01, p 0-0.3; S08, p 0.4-0.75). At most 14 spans animating at once.

### 5.3 Camera moves (G0 → G1 → G2 → PAIR → G5 → G0)

Scrubbed where a scene owns the window (S01 p 0.3-0.4 to G1; S03a p 0-0.1 to G2; S08 p 0-0.4 to G0); otherwise 800ms smooth on a jump. `c` linear, `R` in log space. On PAIR, one Turn becomes two: the left Turn keeps slot A; the right Turn is a second instanced draw of slot B with its own camera, both entering from the G1 position (800ms).

### 5.4 Story-card choreography (S02)

The reference deck: first card rises from below (800 premium), then the row translates left per card (scrubbed, 4 cards over p 0.1-0.9), progress segments fill linearly. Card 1: the 8 u32 values tick ✓ one by one (200ms each) as the worker recomputes them; the bridge visual draws 64 threads top to bottom (scrubbed with the card's local progress). Card 2: density silhouettes fill from baseline up (600 smooth). Reduced motion: stacked cards, ticks shown at once.

### 5.5 Re-wind (S01 steps, the DECISION radio, THE LAB levers, S08 replay)

Trigger: step threshold or control. `u_rewind` 0 → 1 over 1200ms (scroll step) or 800ms (control), smooth. Each thread keeps its radius samples and moves only in angle; ledgers swap on landing; payback squares crossfade at landing; the parity mark appears 200ms later. Interruption: retarget (section 4). Reduced motion: instant swap with a 200ms crossfade. Performance: uniforms only after one slot upload.

### 5.6 More futures (S03a)

Trigger: n step. `u_count` steps from the old to the new instance count; new threads appear with opacity 0 → 16% over 600ms premium in index order (all at once, not one by one); counts above the tier cap do not draw more threads, and the ledger says `{{n_drawn}} DRAWN · STATISTICS FROM ALL {{n}}`. The CI brackets on the ruler narrow over 600ms smooth. The 100,000 step shows `PRECOMPUTED` and draws no more threads.

### 5.7 Learning narrows (S03b)

Each observation (scroll step or SUCCESS/FAILURE) appends one row to the belief column: the new credible band grows from the previous band's width to its own (600 smooth) and the column scrolls up by one row height (scrubbed within the stage); the confidence brackets snap to their new ends 100ms after the band lands (they are a different object and never share the band's tween). The coverage step crossfades the column to two text rows (350).

### 5.8 The Unroll (S04)

Scrubbed: `u_unroll` = ease_symmetric over p 0.05-0.40, camera G2 → FALL in the same parameter. At `u_unroll` = 1 the 100% line appears as a 2px gap (opacity of threads crossing it multiplied by 0 within ±1px, 200ms). p 0.45-0.55: the waterfall dims to 20% and the forecast series thread draws top to bottom (scrubbed); p 0.55-1: forecast threads fall below "now", dashed interval hairlines draw downward with them; the coverage counter counts up (linear, the real replicate tally, 600ms per horizon step). LEVEL and METHOD changes crossfade hairlines (200) and re-count (600).

### 5.9 Draw the Line (S05, S05b)

The threshold handle follows the pointer 1:1 (no easing on direct manipulation); applicants it passes dim 100% → 40% over 200ms each; the cost readout updates per frame from the worker-free formula (250 rows, main thread, under 0.1ms); the minimum on the cost thread brightens when the handle is within 0.005. The cost slider re-computes the curve (main thread) and moves the minimum mark over 600 smooth. S05b: choosing an applicant card raises it (350 premium); its changed features flip from old to new value with a 600ms numeral/text crossfade; the `MODEL COUNTERFACTUAL` label is present before the values change.

### 5.10 Trade-offs and what matters (S06)

S06a: the 21 front points enter left to right (600 premium, 40ms stagger). An epsilon change: status `RUNNING IN YOUR BROWSER · HiGHS` (200), then the solved point lands from the previous point position (600 smooth) with its status word; no line is drawn between front points. S06b: at each N step, replicate ticks move from their previous-N positions to the new ones (600 smooth, keyed by replicate seed); the analytic white tick never moves.

### 5.11 The Unchosen (S07)

Benchmark line draws top to bottom (600 premium) first; estimator rows enter one by one beneath it (350, 80ms stagger), each with its gap counting from 0 (600). SAMPLE switch: rows slide to their new estimates (600 smooth, keyed by estimator id), gaps re-count. Selecting an estimator lifts its row (opacity others 50%) and lights its assumptions and DAG edges (200). Argument stack: the reference's `all .35s ease-in-out`, older cards recede by scale 0.96 and muted palette (opacity floors per ED #13).

### 5.12 Closing: every decision, again (S08)

p 0-0.4: camera to G0 (scrubbed). p 0.4: one replay of the eight beats on the visitor's decision and seed (1.6s total, 200ms per beat, timed, skipped if the visitor scrolls back above 0.35). p 0.4-0.75: statement word reveal (scrubbed). REPLAY re-runs S00's timeline from the decision square; RESET restores decision A and seed 20261011 with a 800ms re-wind.

### 5.13 Component microinteractions

Square buttons and chips: hover background to white, text to black (200 ease-in-out, the reference's nav hover); press scale 0.98 (120); focus a 2px white outline offset 2px (instant). Steppers and radios: the active block slides (`translateX`, 350 smooth). Sliders: 44px handles, keyboard arrows step 0.01 (threshold) or 1 (cost), Shift x10. Inspector: enters 350 premium, follows the hovered thread's end point, disabled during re-winds. Seed field: on commit, the Turn dims to 60% while `RUNNING IN YOUR BROWSER · SEED {{seed}}` counts ms, then re-grows with the S08 beat timing.

## 6. Navigation, chapter jumps, interruption

### 6.1 Nav

Bottom bar (D): items `ANOTHER DECISION · WHAT IS REAL · ENOUGH · LEARNING · UNROLL · THE LINE · TRADE-OFFS · UNCHOSEN · THE LAB`, active block white with black text sliding by `translateX/scaleX` (350 smooth, ED #9). T/M: the MENU pill shows the current section name (label swap 200); tapping opens the blurred list upward with a clip-path reveal (300, ED #9). REPLAY INTRO and MOTION ON/OFF at the right end.

### 6.2 Direct chapter jumps: instant, with a stage fade

As observed on the reference (nav click reaches the section in under 190ms, no smooth scroll): jump `scrollTo` instantly to the track's rest point (the p where the scene's default state settles), with a 350ms stage fade (out 150, in 200) masking the change. Uniforms and camera are set to the target state directly (no re-wind replay). `pushState` on jumps, `replaceState` while scrolling (ED #9).

### 6.3 Scroll interruption

Reverse scroll reverses every scrubbed function exactly; stepped transitions retarget to the state for the current p. Rapid scroll across several steps lands on the final state with one transition, not a queue. Resizing mid-scene recomputes camera and canvas size at the current p and re-reads the viewport class from `matchMedia` (ED #39).

## 7. Operational state motion

| State | Motion |
|---|---|
| Initial | The decision square and unit line; no threads |
| Loading | The mono line with a real % (linear); no spinner |
| Computing | `RUNNING IN YOUR BROWSER · SEED · {{ms}} MS` counts real ms (linear); the previous state at 60% |
| Ready | Data enters (600 smooth) |
| Empty | Copy crossfades in (350) |
| Error | The line turns `--state-error` (200); RETRY appears (350 premium) |
| Retry | RETRY re-runs the same request; the line returns to Loading |
| Disabled | 50% white, no hover response; tooltip with reason |
| Reset | A confirm chip (`RESET? YES / NO`, 200) then the scene's default with its standard transition |
| Parity | `MATCH` / `MISMATCH` fades in 200ms after landing; MISMATCH stays until the next compute |

## 8. Reduced motion

`prefers-reduced-motion: reduce` (or MOTION OFF in the nav):
- Lenis off; pinned tracks become normal flow (the shared reduced-motion path); every scene shows its end state with its controls working.
- S00: end state; the eight beats are not played.
- Re-winds, the Unroll, band narrowing, point landing: 200ms crossfades between end states.
- The Unroll is shown as a static 3-frame strip (Turn, half, waterfall).
- Word reveals: sharp text at once. Story cards stacked. The glow stays (it is static).
- No scroll position ever traps; every control remains keyboard reachable.

## 9. Performance budgets and rendering

### 9.1 Rendering decisions

- **Raw WebGL2, no three.js or R3F** (precedents ED #19, #24): one program, one instanced draw, uniforms for every animation; three.js would add about 150 KB gz for nothing the Turn needs.
- **Canvas2D overlay** for non-thread marks (payback squares, interval marks, the credit column, Pareto points, DAG hairlines, replicate ticks): at most about 600 marks, redrawn only when dirty.
- **DOM** for all text and controls.
- **Compute worker** owns xoshiro128** (exact u32 parity with `m02`), the ten module ports and the hero paths; transfers `Float32Array`s. **HiGHS worker** (highs@1.15.3, ED #21) lazy at S06.
- **OffscreenCanvas not used** (one main-thread context keeps resize and accessibility simple); revisit only if QA measures long tasks from drawing.

### 9.2 Budgets and tiers

| Tier | Selection | Threads drawn | DPR cap | Glow | Target |
|---|---|---|---|---|---|
| HIGH | WebGL2, `hardwareConcurrency` ≥ 8, not a coarse pointer, and the S00 beats' p95 frame time ≤ 16.7ms | 12,000 | 1.5 | 1/4 res | 60fps during transitions on a 2020-class integrated GPU |
| MED | WebGL2 otherwise, or HIGH demoted (p95 > 20ms over 30 frames) | 5,000 (T/M: 3,000) | 1.5 (M 2.0) | 1/4 res | 60fps D, 30fps+ M |
| LOW | No WebGL2, context loss, MED demoted (p95 > 34ms), or `?tier=low` | 1,200 as Canvas2D paths, static (re-winds are 200ms crossfades) | 1.0 | none | No dropped input; static frames |

- Statistics always come from the full published n in the worker, never from the drawn subset; the unit line prints both numbers.
- Demotion is one-way per session and announced in the footer (`DRAWING {{n}} FUTURES ON THIS DEVICE`).
- **Arithmetic** (to be measured in QA, not a measurement): HIGH 12,000 x 96 = 1.15M line segments per redraw; at about 60px average segment length at DPR 1.5 that is about 70M fragments per redraw, inside an integrated GPU's budget for 16.7ms with additive blending and no depth. Idle frames cost nothing (draw only when dirty).
- **Worker cost** (to be measured): one decision = 12,000 futures x 5 draws x 8 years, under 10ms; 20,000 for statistics, under 15ms.
- **Memory:** two decision slots at HIGH = 1.06 MB GPU; static sample buffer 0.4 KB.

### 9.3 Loading budget (Lighthouse perf 90+, LCP ≤ 2.5s, CLS ≤ 0.1)

- Initial JS ≤ 120 KB gz (shell, scroll, nav, Turn renderer); the worker chunk ≤ 40 KB gz, after first paint; module scenes lazy per scene; HiGHS-wasm (about 1.2 MB gz) only at S06 or a deep link.
- First-paint data: `meta.json` + `facts.json` only. Module artifacts (all under 15 KB raw today) load at their scene's track entry minus one viewport.
- Fonts subset to Latin (ED #30 precedent).
- WebGL context, shader compile and the glow framebuffer after first paint; the hero never waits on them to paint text.

## 10. Technical stack recommendation

React + TS strict + Vite + Tailwind (shared shell). Lenis plus the shared single rAF loop (no GSAP, ED #6). Raw WebGL2 for the Turn, Canvas2D overlay, two module workers. No three.js, no D3 (the few scales are 10-line functions with Vitest), no charting library (rejection criterion 3).

## 11. Motion test plan

1. Intro: SKIP visible at 100ms; nav within 400ms of SKIP; LCP element `h1[data-hero]`; end-state thread count = tier count; payback squares = threads with recovered ≥ 1 (exact).
2. Thread rule at rest states (section 2 debug hook), including after a seed change in THE LAB.
3. Common random numbers: same five draws per index across decisions.
4. Re-wind mid-flight retarget: change decision at 50% of a re-wind; final state equals the new decision exactly; no ledger shows a non-record value in 10 sampled frames.
5. Unroll: three threads within 1px of polar targets at `u_unroll` 0 and cartesian at 1; no left-to-right time axis anywhere (DOM and canvas review).
6. Interval grammar: credible elements are filled bands, confidence elements are brackets, prediction elements dashed hairlines; no label crossover.
7. S05: cost readout equals the recomputed formula at 20 handle positions; at cost 5 the minimum equals `m06.optimum.t_opt_grid`.
8. S06a: live solve objective within `m07.tolerance`; no `.wasm` request before S06.
9. S07: whenever an observational row is visible, the benchmark line is visible; gaps equal estimate minus benchmark.
10. Parity: THE LAB RUN ALL TEN shows MATCH for every browser-recomputed part at seed 20261011; PRECOMPUTED parts (m05 coverage, m06 fit and splits, m10 NSW) are labelled and identical across seeds; at seed 7 the seeded rows read `NO PUBLISHED VECTOR FOR SEED 7` and no row reads MATCH.
17. Compute-state honesty: the S00 chip has no `RUNNING IN YOUR BROWSER` before the worker's first message; with the worker blocked (Playwright route abort), the main-thread fallback draws 1,200 threads and the chip says MAIN THREAD.
11. Sticky scenes release at track end; reverse and rapid scroll; nav jumps land at rest points; Back/Forward; resize mid-scene in both scrollbar modes (ED #39).
12. Reduced motion: no pinned track; all controls work; no trap.
13. Tiering: forced `?tier=low` renders Canvas2D with the unit line's drawn count; a simulated slow frame demotes HIGH to MED once.
14. Draw-only-when-dirty: WebGL frame counter flat for 2s when idle.
15. Distinctness: the QA contact sheet places the built S00 and S08 D/T/M frames beside the P01-P07 frames used in `design/sketches/distinctness-sheet.png`, in colour and greyscale; the payback ladder must not read as a continuous line at 1440.
16. Copy: no U+2014/U+2015; no "AI", "smart", "intelligent"; every seeded view shows its seed.
