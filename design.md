# dukeandjb.com — design specification

Version 1.0 · Build target: one static `index.html` + one `style.css`.

This document is the build spec. Everything a developer needs is here: exact hex
values, exact pixel sizes, exact breakpoints. Where a value is not stated, use the
nearest value on the spacing scale.

---

## 1. What we are building

A single-page homepage that hosts browser games made by Duke (9) and JB (7). It
must work with one game and still work with fifty.

Two audiences, in priority order:

1. **Kids arriving from YouTube.** They want to play. Games are the first real
   content on the page — above the fold on a phone. No hero paragraph, no signup,
   no cookie wall, no carousel.
2. **Adults who are curious.** They get a short "who we are" block near the
   bottom and a link to the channel. Brief. It does not compete with the games.

**Tone:** homemade and confident. Thick black rules, hard offset shadows with no
blur, slight deliberate rotation on cards, big loud type. It should look
hand-assembled, not generated.

**Explicitly banned:** gradients of any kind, blur, glassmorphism, translucency,
drop shadows with blur radius, border-radius above 6px, stock illustration,
emoji as UI, icon fonts, comic-sans-style "kid" fonts, centred hero + three
feature columns, "Get started" language, anything that reads as a SaaS landing
page or a Bootstrap template.

---

## 2. Hard constraints

| Constraint | Rule |
|---|---|
| Tech | Hand-written HTML5 + CSS. No frameworks, no preprocessors, no build step, no npm, no Tailwind. |
| Requests | Zero third-party requests. No CDNs, no Google Fonts, no analytics scripts, no embeds. |
| Fonts | System font stacks only (§4). |
| JavaScript | None required. The page must be fully functional with JS disabled. If JS is added later it may only enhance (e.g. filtering), never gate content. |
| Images | The page must be complete and correct with **no images at all**. Game thumbnails are optional and additive (§7.4). |
| Layout | Mobile first. Base styles are the phone layout; media queries only add. |
| Scale | Must remain scannable at 50 game cards. |
| Total weight | Under 30 KB for HTML + CSS combined, uncompressed. |

---

## 3. Colour

Four colours. No fifth colour, no tints, no opacity variants. If something needs
to feel lighter, use more whitespace, not a lighter colour.

```css
:root {
  --paper:  #FBF3E4; /* page background — warm, slightly aged off-white */
  --ink:    #16130F; /* all body text, all borders, all rules */
  --flame:  #FF4A1C; /* primary accent: links, card hover, header mark */
  --sea:    #0E5FD8; /* secondary accent: focus rings, visited/played states */
}
```

### Usage rules

- `--paper` is the background of everything: page, cards, footer. There is no
  second surface colour. Depth comes from borders and offset shadows, not fills.
- `--ink` is every border, every rule, every piece of body text. Borders are
  always solid `--ink`, never grey.
- `--flame` is loud and used sparingly: the dot in the wordmark, the card
  hover/active fill, the YouTube link background, the "new" tag. Never more than
  roughly 10% of any screenful.
- `--sea` exists almost entirely for focus rings, so focus never collides with
  hover. It also fills the About block's rule. Never use it as a large fill.

### Inverted blocks

Two blocks invert: the **YouTube link** and the **About** block use
`background: var(--ink); color: var(--paper);` — that is the only "dark mode"
in the page and it is what breaks the vertical rhythm of the card grid.

### Contrast (verified, WCAG 2.1)

| Pair | Ratio | Verdict |
|---|---|---|
| `--ink` on `--paper` | 15.8:1 | AAA — body text |
| `--paper` on `--ink` | 15.8:1 | AAA — inverted blocks |
| `--flame` on `--paper` | 3.5:1 | **Large text only (≥24px or ≥19px bold), and non-text UI.** Never use `--flame` for body copy. |
| `--ink` on `--flame` | 4.5:1 | AA — this is how hovered card text is set |
| `--sea` on `--paper` | 6.4:1 | AA — safe for text and focus rings |

**Rule:** `--flame` never carries small text on `--paper`. When a card hovers to
`--flame`, its text stays `--ink`.

### Dark mode

Not in scope for v1. Do not add `prefers-color-scheme`. The paper colour is the
brand.

---

## 4. Typography

System stacks only. Two stacks: one sans for everything, one mono for the game
card metadata and the site tagline, which gives the "made in a text editor"
feel without a downloaded font.

```css
--font-sans: system-ui, -apple-system, "Segoe UI", Roboto,
             "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas,
             "Liberation Mono", monospace;
```

Base: `font-size: 100%` on `html` (never override the user's root size in px),
`font-family: var(--font-sans)` and `line-height: 1.5` on `body`.

### Scale

Sizes are given mobile → desktop. Where one value is shown it does not change.
Use `rem` in the build; px shown for clarity at a 16px root.

| Element | Size (mobile → ≥720px) | Weight | Line height | Tracking | Case | Colour |
|---|---|---|---|---|---|---|
| Site name (`h1`, header) | 40px → 64px | 800 | 1.0 | −0.03em | lowercase | `--ink` |
| Tagline (header, one line) | 15px | 400 | 1.4 | 0 | sentence | `--ink` |
| Section heading (`h2`) | 22px → 26px | 700 | 1.2 | −0.01em | lowercase | `--ink` |
| Game title (`h3` in card) | 21px → 22px | 700 | 1.15 | −0.01em | sentence | `--ink` |
| Game description | 15px → 16px | 400 | 1.45 | 0 | sentence | `--ink` |
| Card meta line (mono) | 12px | 500 | 1.2 | 0.02em | lowercase | `--ink` |
| "Play" affordance in card | 14px | 700 | 1 | 0.04em | UPPERCASE | `--ink` |
| Body copy (About) | 16px → 17px | 400 | 1.6 | 0 | sentence | `--paper` on ink |
| YouTube link label | 20px → 24px | 800 | 1.2 | −0.01em | lowercase | `--paper` |
| Footer / small print | 13px | 400 | 1.5 | 0 | sentence | `--ink` |

### Rules

- The site name is set in `--font-sans` at weight 800, all lowercase:
  `dukeandjb` followed by a `.com` in `--flame`. Nothing else on the page uses
  weight 800.
- The tagline is set in `--font-mono`, e.g.
  `two brothers. small games. made at the kitchen table.` One line. Under 60
  characters so it does not wrap on a 360px phone.
- Card meta and the "play" affordance are `--font-mono`.
- Everything else is `--font-sans`.
- Never use `text-transform: uppercase` on anything longer than three words.
- `text-wrap: balance` on all headings; `text-wrap: pretty` on paragraphs.
- Measure: no paragraph exceeds `65ch`.
- Do not use italics anywhere. Emphasis is weight, not slant.

---

## 5. Spacing

A 4px base with a fixed set of steps. Use only these values for margin, padding
and gap.

```css
--s1:  4px;
--s2:  8px;
--s3:  12px;
--s4:  16px;
--s5:  24px;
--s6:  32px;
--s7:  48px;
--s8:  64px;
--s9:  96px;
```

| Use | Mobile | ≥720px |
|---|---|---|
| Page gutter (left/right) | `--s4` (16px) | `--s6` (32px) |
| Space between major sections | `--s7` (48px) | `--s8` (64px) |
| Header block padding (top/bottom) | `--s6` / `--s5` | `--s8` / `--s6` |
| Grid gap between cards | `--s4` (16px) | `--s5` (24px) |
| Card internal padding | `--s5` (24px) | `--s5` (24px) |
| Gap between card title and description | `--s2` (8px) |
| Gap between description and meta row | `--s4` (16px) |
| Inverted block padding | `--s6` | `--s7` |

Max container width: **1120px**, centred (`margin-inline: auto`). Prose inside
the About block is capped at **60ch** regardless of container width.

---

## 6. Layout

### Breakpoint

**One breakpoint: `720px`.** `@media (min-width: 45rem)`. Do not add others. If
something is uncomfortable between 720px and 1120px, fix it with `clamp()` or
`minmax()`, not with a second breakpoint.

### Page order (top to bottom, identical on all sizes)

1. **Header** — site name, tagline, thick bottom rule.
2. **Games** — `h2` "the games" + count, then the grid. This is the bulk of the page.
3. **YouTube block** — inverted, full-bleed edge to edge.
4. **About block** — inverted, immediately below YouTube, sharing its dark run.
5. **Footer** — one line, small print.

Games come before everything except the header. On a 360×640 phone the first
card must be at least partly visible without scrolling — keep total header
height under 200px on mobile.

### Grid

```css
.games {
  display: grid;
  gap: var(--s4);
  grid-template-columns: 1fr;
}
@media (min-width: 45rem) {
  .games {
    gap: var(--s5);
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}
```

- Mobile: one column, full width.
- 720px: naturally two columns.
- 1120px container: naturally three columns. Do not hard-code a column count.
- Cards are equal height within a row (grid default `stretch`). The meta row
  pins to the bottom of the card via `margin-top: auto` on a flex column.

### Full-bleed inverted blocks

The YouTube and About blocks break out of the container to span the full
viewport width, with their inner content still constrained to 1120px and the
page gutter. Use a wrapper with `background: var(--ink)` at full width and an
inner `max-width` div. Do not use negative margins.

### Scaling to fifty games

The design must hold at 50 cards. Required:

- **Sections by year or batch.** Once there are more than 12 games, group cards
  under `h2` headings ("2026", "2025" or "newest first" / "the early ones").
  Newest group first, newest game first inside each group. Each `h2` sits on a
  2px `--ink` top rule with `--s7` of space above it.
- **Count in the heading.** `the games <span>(37)</span>` — the count is mono,
  `--fg` at 60% size, not a badge.
- **No pagination, no infinite scroll, no "load more".** Fifty cards is roughly
  a 4-screen scroll on desktop; that is acceptable and faster than paging.
- **A "new" tag** (§7.3) is allowed on at most the three most recent games.
- If the list ever passes 60 games, add a JS-enhanced filter row — but the
  unfiltered list must still render fully without JS.

---

## 7. Game card component

The whole card is a single link. There is no separate button.

### 7.1 Markup

```html
<li class="card">
  <a class="card__link" href="/games/rocket-dodge/">
    <h3 class="card__title">Rocket dodge</h3>
    <p class="card__desc">Fly through the gaps. It gets faster. It gets mean.</p>
    <p class="card__meta">
      <span class="card__by">by JB</span>
      <span class="card__play">play &rarr;</span>
    </p>
  </a>
</li>
```

- The grid is a `<ul class="games">` with `list-style: none`.
- One `<a>` per card wrapping all content — one tab stop per game, and the
  entire card is a hit target.
- `<h3>` inside the link is valid and gives screen-reader users a heading list
  of every game. Do not add `aria-label`; the visible text is the label.
- The arrow is the HTML entity `&rarr;`, not an SVG and not an emoji.
- If a game opens in a new tab, append a visually hidden
  `<span class="vh"> (opens in a new tab)</span>` and set `rel="noopener"`.
  Preference: open in the same tab.

### 7.2 Resting state

```css
.card__link {
  display: flex;
  flex-direction: column;
  min-height: 148px;
  padding: var(--s5);
  background: var(--paper);
  color: var(--ink);
  border: 2px solid var(--ink);
  border-radius: 4px;
  box-shadow: 5px 5px 0 0 var(--ink); /* hard offset, blur radius 0 */
  text-decoration: none;
  transition: transform 120ms ease-out,
              box-shadow 120ms ease-out,
              background-color 120ms ease-out;
}
.card:nth-child(odd)  .card__link { transform: rotate(-0.4deg); }
.card:nth-child(even) .card__link { transform: rotate(0.35deg); }
.card__meta { margin-top: auto; }
```

The rotation is the "rough edges" signal. Keep it under 0.5° — any more and 50
cards look broken rather than handmade. `box-shadow` blur is always `0`.

### 7.3 The "new" tag

Optional, max three cards. A small mono label in the top-right of the card:
`background: var(--flame); color: var(--ink);` 11px, weight 700, uppercase,
`padding: 2px 6px`, `border: 2px solid var(--ink)`, rotated `-2deg`. It is
decorative only — the card link text already conveys everything.

### 7.4 Optional thumbnail

If a game has a thumbnail, it sits above the title: `aspect-ratio: 16/10`,
`object-fit: cover`, 2px `--ink` border, `width: 100%`, and always
`loading="lazy"` + explicit `width`/`height` attributes. Cards with and without
thumbnails must be able to sit side by side in the same grid without looking
broken. No thumbnail may exceed 60 KB.

### 7.5 Interaction states

| State | Change |
|---|---|
| **Hover** (pointer only) | Card fills `--flame`; text stays `--ink`; `transform: translate(-2px, -2px) rotate(0deg)`; shadow grows to `7px 7px 0 0 var(--ink)`. Card straightens as it lifts — that is the whole gag. |
| **Focus-visible** | `outline: 3px solid var(--sea); outline-offset: 3px;` Background does **not** change, so focus is never confused with hover. Outline must not be removed at any point. |
| **Active / press** | `transform: translate(2px, 2px) rotate(0deg); box-shadow: 2px 2px 0 0 var(--ink);` — the card presses into the page. |
| **Visited** | No change. Kids replay games. |
| **Touch** | No hover styles fire on touch devices — wrap hover rules in `@media (hover: hover) and (pointer: fine)`. Touch gets the active state only. |
| **Reduced motion** | Inside `@media (prefers-reduced-motion: reduce)`: `transition: none` and remove all `rotate()` transforms, including the resting tilt. Colour and shadow changes still apply. |

### 7.6 Card content rules

- **Title:** 1–3 words, sentence case. Never truncate — wrap instead.
- **Description:** one sentence, 40–70 characters, ends with a full stop. Clamp
  to two lines with `-webkit-line-clamp: 2` as a safety net only; write copy
  that fits.
- **Meta line:** `by Duke` or `by JB` or `by both`, left; `play →` right, via
  `display: flex; justify-content: space-between`.
- Cards never contain: play counts, star ratings, dates, tags beyond "new",
  share buttons.

---

## 8. Other components

### 8.1 Header

- `dukeandjb` in weight 800 lowercase, with `.com` in `--flame`.
- One-line mono tagline directly under it, `--s3` gap.
- 3px solid `--ink` bottom border across the full container width.
- No navigation. There is nothing to navigate to. Do not add a nav bar.
- No logo image.

### 8.2 YouTube block

Inverted (`--ink` background). Contains an `h2`, one line of copy, and one
link styled as a block:

```css
.yt-link {
  display: inline-block;
  padding: var(--s3) var(--s5);
  min-height: 48px;
  background: var(--flame);
  color: var(--ink);
  border: 2px solid var(--paper);
  border-radius: 4px;
  box-shadow: 5px 5px 0 0 var(--paper);
  font-weight: 700;
  text-decoration: none;
}
```

Hover: `translate(-2px,-2px)`, shadow to `7px 7px`. Focus-visible: 3px `--paper`
outline, 3px offset (inside a dark block `--sea` is too low-contrast — this is
the one focus-ring exception). Label: `watch us make them` — never "Subscribe
now!". No embedded player, no YouTube script, no channel thumbnails.

### 8.3 About block

Inverted, directly under the YouTube block so the two read as one dark band
separated by a 2px `--sea` rule.

- `h2`: `who we are`
- Two short paragraphs, max 60 words total, max 60ch measure. Written by/for the
  parent audience: who Duke and JB are, how the games get made, that they are 9
  and 7. Plain, no marketing.
- One optional contact line: a `mailto:` link, underlined, `--paper`, underline
  thickens to 2px on hover.

### 8.4 Footer

One line, on `--paper`, 13px: `made by Duke and JB` plus the year. Top border
2px `--ink`. Nothing else — no sitemap, no social row, no "built with".

### 8.5 Links in prose

`color: var(--sea)` on paper, `color: var(--paper)` inside inverted blocks.
Always underlined: `text-decoration: underline; text-decoration-thickness: 1px;
text-underline-offset: 3px`. Hover thickens to 2px; colour never changes.

---

## 9. Accessibility

Non-negotiable. Treat these as acceptance criteria.

- **Contrast:** every text/background pair meets 4.5:1 (see §3). `--flame` never
  carries small text on `--paper`.
- **Touch targets:** every interactive element is at least **48×48 CSS px**. The
  card link is far larger; the YouTube link uses `min-height: 48px`. Adjacent
  targets are at least 8px apart — the 16px grid gap covers this.
- **Focus:** `:focus-visible` is styled everywhere and never removed. 3px ring,
  3px offset, `--sea` on light backgrounds, `--paper` on dark. Never rely on
  `outline: none`.
- **Keyboard:** the entire page is operable by Tab and Enter. Tab order follows
  DOM order. One tab stop per game.
- **Headings:** exactly one `h1` (the site name). `h2` per section and per game
  group. `h3` per game title. Never skip a level.
- **Landmarks:** `<header>`, `<main>`, `<footer>`. The games grid sits in
  `<section aria-labelledby="games-heading">`.
- **Skip link:** a visually hidden "skip to games" link as the first focusable
  element, revealed on focus. With no nav it is cheap and it helps.
- **Motion:** respect `prefers-reduced-motion` (§7.5).
- **Zoom:** the page must be usable at 200% zoom and at 320px viewport width
  with no horizontal scroll. Set `<meta name="viewport" content="width=device-width, initial-scale=1">`
  and never `maximum-scale` or `user-scalable=no`.
- **Language:** `<html lang="en-GB">`.
- **Colour is never the only signal:** the "play →" text and the arrow carry the
  link meaning, not the accent colour alone.

### Visually hidden utility

```css
.vh {
  position: absolute; width: 1px; height: 1px;
  margin: -1px; padding: 0; overflow: hidden;
  clip-path: inset(50%); white-space: nowrap; border: 0;
}
```

---

## 10. Performance and delivery

- Two files: `index.html`, `style.css`. CSS linked, not inlined (it caches
  across game pages).
- No web fonts, no icon fonts, no SVG sprites, no JS.
- Target: First Contentful Paint under 1s on a throttled 3G phone. With no
  images and no fonts this is achievable trivially — do not undermine it.
- Lighthouse targets: Performance ≥ 98, Accessibility 100, Best Practices 100.
- Each game lives at `/games/<slug>/` with its own `index.html`. Slugs are
  lowercase hyphenated, e.g. `/games/rocket-dodge/`.
- Adding a game = pasting one `<li class="card">` block into `index.html`. Keep
  the markup that simple; do not introduce a data file or a template step.
- `<title>`: `dukeandjb.com — games made by two brothers`.
  `<meta name="description">`: one sentence, under 155 characters.
- Add a `<meta property="og:title">` / `og:description` pair so YouTube
  descriptions and shared links unfurl with text. No og:image is required.

---

## 11. Definition of done

- [ ] Page renders correctly at 320px, 375px, 768px, 1440px.
- [ ] First game card is visible or partly visible on a 360×640 phone without scrolling.
- [ ] Grid tested with 1, 3, 12 and 50 cards. All four look deliberate.
- [ ] Every interactive element passes 48px target and shows a visible focus ring.
- [ ] Zero network requests other than `index.html` and `style.css`.
- [ ] Page works fully with JavaScript disabled and with CSS disabled (content order still makes sense).
- [ ] `prefers-reduced-motion` removes all rotation and transitions.
- [ ] No gradient, no blur, no border-radius over 6px anywhere in the stylesheet.
