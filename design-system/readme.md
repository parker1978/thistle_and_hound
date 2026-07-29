# Thistle & Hound Design System

Thistle & Hound is a mobile pet-care company — kind, calm, one-on-one dog and cat grooming performed in the client's own home. Positioning: **"Kind Care; Zero Car Rides."** No cages, no waiting rooms, no rushed appointments. The whole brand argument is that a fully-equipped groomer comes to you, so a nervous pet never has to leave home.

**Sources provided:** one logo file, `uploads/thistle_and_hound_logo.PNG` (a circular engraved badge — braided-rope border, a labrador in profile with a thistle flower, "THISTLE & HOUND / MOBILE PET CARE" set in small caps), plus a short brand brief (warm earthy colors; green for the thistle stem, purple for the thistle bloom). No codebase, Figma file, decks, or additional imagery were attached — everything below beyond the logo is a first design pass built from that brief, meant to be iterated with the real team.

## Products in this system
No product screens were provided. Two plausible customer-facing surfaces for a home-service booking business were mocked as a starting point:
- **Marketing & booking website** (`ui_kits/website/`) — homepage, service menu, and a booking flow.
- **Client mobile app** (`ui_kits/client-app/`) — appointment dashboard, booking, groomer profile, tracking.

Both are cosmetic recreations built for this brand, not real product exports — replace with real screens/Figma as soon as they exist.

## Content fundamentals
- **Voice:** calm, plain, unhurried. Whole sentences, no exclamation points, no urgency/countdown language ("Book now!!", "Limited spots!"). The logo's own copy sets the tone: "MOBILE PET CARE" — flat, descriptive, no adjectives doing the selling.
- **Point of view:** direct address, "you"/"your pet", never third-person marketing distance. "We come to you" not "Thistle & Hound provides services."
- **Casing:** sentence case for all UI copy and headlines (the logo's small-caps ring is a one-off badge treatment, not a body-copy pattern). Avoid ALL CAPS outside of that badge context and small eyebrow labels.
- **Structure:** short declarative sentences, often in groups of three mirroring the brief itself — "No cages, no waiting room, no rushed appointments." Lead with the absence of a pain point, not a feature list.
- **Emoji:** none. The brand's warmth comes from calm language and craft (the engraved badge), not decoration.
- **Example lines:** "Kind care, at home." / "Zero car rides." / "Your groomer comes to you — with everything they need in hand."

## Visual foundations
- **Color:** two brand hues drawn directly from the thistle plant — a muted forest **green** (`--color-primary`, the stem) and a dusty **plum/thistle purple** (`--color-accent`, the bloom), both desaturated rather than bright. Neutrals are warm "sand" tones (cream page background, parchment surfaces) rather than cool gray — see `tokens/colors.css`. Status colors (success/warning/danger/info) stay inside the same warm, muted family; nothing neon.
- **Type:** a serif/sans pairing. **Cormorant Garamond** (display serif) for headlines and the wordmark voice — echoes the engraved, classical feel of the badge mark. **Work Sans** (humanist sans) for body copy and UI — calm and legible at small sizes. *Font files were not provided; both are Google Fonts substitutions loaded via `styles.css`. Flag to the brand team and swap in licensed files if the real brand uses something else.*
- **Backgrounds:** flat warm cream/parchment surfaces (`--color-page`, `--color-surface`). No gradients, no photography-heavy full-bleed hero treatment assumed yet (no real photography was provided) — hero sections use `<image-slot>`-style placeholders for the eventual real photos of groomers/pets at client homes.
- **Imagery:** none provided beyond the logo. Placeholder slots in the UI kits are neutral warm-toned rectangles; replace with real, warm-toned (not cool/gray/high-contrast b&w) photography of groomers and pets in home settings.
- **Animation:** calm and unhurried — a single shared easing curve (`--ease-standard`, a gentle ease-out, never a bounce/spring) and modest durations (120–360ms). Fades and soft translateY lifts only.
- **Hover states:** solid buttons deepen one step (`--color-primary` → `--color-primary-hover`); outline/ghost controls gain a soft tinted background (`--color-surface-alt` or `-soft` token); interactive cards lift 2px with a larger soft shadow.
- **Press/active states:** solid buttons deepen a second step and scale to 0.98 — a small, quiet press, not a bouncy one.
- **Borders:** thin, warm-neutral hairlines (`--color-border`, 1px) on cards and inputs; a slightly heavier 1.5px "strong" border for outlined buttons/unchecked controls.
- **Shadows:** soft and warm-tinted (never pure black) — a barely-there `sm` for resting cards, a `md`/`lg` for lifted/modal surfaces. No hard drop shadows.
- **Corner radii:** soft but not bubbly — 6–24px depending on scale (inputs/small controls at 10px, cards at 16px, hero surfaces at 24px). Full pill radius reserved for tags, badges and switches only.
- **Cards:** warm cream surface, hairline border, small soft shadow, 16px radius, no colored left-border accent.
- **Transparency/blur:** used once, deliberately — the modal scrim (`Dialog`) is a dark, semi-transparent ink overlay; no frosted-glass/backdrop-blur elsewhere.
- **Layout:** centered content columns (`--container-max` 1200px, `--content-max` 720px for reading copy); no fixed/sticky chrome assumed beyond a simple top nav and a mobile tab bar in the app kit.

## Iconography
No icon set, sprite, or icon font was provided with the brief. The UI kits substitute **Lucide** icons (thin 1.5px stroke, rounded joins) loaded from its CDN — chosen for a calm, hand-drawn-adjacent line weight that doesn't fight the engraved badge mark. No emoji, no unicode-glyph icons (aside from a plain "✕" dismiss glyph used as literal text, not an icon). Star ratings are a small custom inline SVG (`Rating` component) rather than an icon-font glyph. **Flag:** if the real brand has its own icon set, swap the Lucide `<script>` include in the UI kit headers and re-point the icon names.

## Intentional additions (components)
No component library/Figma source was provided, so a standard primitive set was authored, sized to a booking product: Button, IconButton, Input, Select, Checkbox, Radio, Switch, Badge, Tag, Toast, Tooltip, Card, Tabs, Dialog — plus two additions beyond the standard set, needed specifically for a home-service booking product:
- **Avatar** — circular groomer/pet photo with initials fallback.
- **Rating** — star rating for groomer/service reviews.

## Components
`components/forms/` — Button, IconButton, Input, Select, Checkbox, Radio, Switch
`components/feedback/` — Badge, Tag, Toast, Tooltip, Rating
`components/surfaces/` — Card, Avatar
`components/navigation/` — Tabs
`components/overlays/` — Dialog

## Index
- `styles.css` — global stylesheet entry (imports everything below)
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `effects.css` (radii/shadow/motion)
- `components/components.css` — shared hover/focus/active state rules for the components above
- `components/<group>/` — component source, one `.jsx` + `.d.ts` + `.prompt.md` per component, one `*.card.html` per directory
- `guidelines/` — foundation specimen cards (colors, type, spacing, radii, brand voice, motion)
- `assets/logo/` — the provided badge mark, plus a background-removed transparent version
- `ui_kits/website/` — marketing + booking website recreation (entry `index.html`)
- `ui_kits/client-app/` — mobile client app recreation (entry `index.html`)
- `SKILL.md` — portable Claude-Code-compatible skill version of this system

## Caveats & ask
This system was built from a single logo and a one-paragraph brief — no codebase, Figma, decks, product screens, or real photography. Treat the color values, type pairing, component set, and both UI kits as a strong **first draft**, not ground truth. The clearest way to iterate toward "perfect": send over (1) any existing product screens or a Figma file if the app/website already exist, (2) real photography of groomers and pets in home settings, and (3) licensed font files if Cormorant Garamond / Work Sans aren't the intended typefaces — then this whole system can be corrected against real sources rather than inferred from the badge alone.
