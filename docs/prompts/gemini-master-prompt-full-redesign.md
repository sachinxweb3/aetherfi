# Master Prompt — Full Dashboard Redesign (World-Class UI + Animation)

> Copy-paste everything in the PROMPT section below into Gemini AI in one message. Notes on how to run this are at the bottom.

---

## PROMPT (copy everything below this line)

You are the **lead product designer and lead frontend engineer** at a top-tier design studio — the kind that builds interfaces for companies like Linear, Stripe, Vercel, Apple, Framer, and Raycast. You have 15–20 years of combined experience in UI design, motion design, and design systems. I am handing you my existing dashboard project. I want you to **fully redesign and rebuild it** — visually, structurally, and functionally in terms of UX flow — into a world-class, premium product interface. This is a **full creative license** project: you are allowed to change layout, structure, component composition, navigation pattern, and visual identity, as long as the core purpose/data/features of the dashboard are preserved (nothing the dashboard currently *does* should be lost — but *how it looks and how it's arranged* can change completely).

Do not hold back. Do not give me a generic, templated, "AI-generated SaaS dashboard" look. I want it to feel like a real design team spent a full year iterating on this — obsessive attention to spacing, typography, color, motion timing, and detail. Original — inspired by the best of the web, not a copy of any single site.

### GOAL

Combine the best qualities of these reference products into one **original, cohesive design system** (do not literally copy any of them — synthesize your own brand language from their principles):

- **Linear** — extreme precision, tight/consistent spacing grid, confident restraint, one accent color, keyboard-first crispness, subtle depth via layered dark surfaces.
- **Stripe** — refined gradient mesh backgrounds used sparingly, clean data-dense tables, polished iconography, professional trustworthy feel.
- **Apple** — typography as the hero, huge confident headlines, generous whitespace, physical/inertia-based motion that feels tactile rather than mechanical.
- **Vercel / Framer** — glassmorphism (backdrop-blur + translucency + hairline borders), monochrome base + single vivid accent, sharp micro-shadows, dark-mode-first aesthetic.
- **Rive / Active Theory-level polish** — where motion isn't decoration, it's core to how information is revealed (staggered reveals, choreographed transitions, elements that feel alive without being distracting).

### FULL SCOPE — YOU MAY CHANGE

- Overall layout and grid system (sidebar vs top-nav vs command-palette-driven navigation — pick whichever best fits a premium dashboard)
- Color system and full theming (dark mode as primary, with a refined light mode if the project supports theme toggling)
- Typography system end-to-end (font pairing, scale, weight hierarchy, tracking)
- Component visual design: cards, buttons, inputs, tables, charts, modals, tooltips, dropdowns, tabs, toggles, badges, avatars, empty states, loading states, error states
- Iconography (pick one consistent icon set, consistent stroke width)
- Information hierarchy — you can reorganize sections/cards for better visual flow, as long as all existing data/features remain accessible
- All animation and micro-interaction behavior

### WHAT MUST STAY INTACT

- All existing features and functionality (nothing the dashboard currently lets the user do should disappear)
- All existing data being displayed (metrics, tables, charts, lists — the actual data/values, not their visual container)
- Any backend/API integration and business logic must keep working — you're changing the presentation layer and how components are composed, not breaking the data flow

### DESIGN SYSTEM SPEC

**Color**
- Dark, near-black base (`#0A0A0B`–`#111113` range) as primary background, with 2–3 layered surface tones for elevation (background → surface → elevated surface)
- One confident accent color (pick something that fits the product's purpose — e.g. electric blue, emerald, or violet) used deliberately for primary actions, active states, key highlights — never overused
- Low-opacity radial/conic gradient glows behind hero/summary areas for depth — subtle, not loud
- Hairline borders (1px, ~8–12% opacity white on dark) instead of heavy dividers

**Typography**
- Modern geometric sans-serif (Inter, Geist, or similar already available) for UI text; consider a distinct display font for large headline numbers/metrics if it elevates the feel
- Tight negative letter-spacing (-0.02em to -0.04em) on large headings
- Clear type scale: display (metrics/hero numbers) → heading → subheading → body → caption/label
- Numbers/metrics should feel like the hero of the interface — large, bold, tabular-nums for alignment

**Spacing & Shape**
- Strict 8px base grid for all padding/margin/gap
- Corner radius scale: small elements 8px, cards 12–16px, modals/large surfaces 20–24px — stay consistent
- Layered soft shadows (multiple low-opacity shadows stacked) instead of one hard drop-shadow

**Components**
- Cards: glassmorphism where elevated (backdrop-blur + translucent surface + hairline border), flat where grounded (base surface tone)
- Buttons: rounded-lg/pill, primary = accent fill with soft glow on hover, secondary = ghost/outline, clear pressed/disabled states
- Charts: gradient-filled line/area charts, animated draw-in on load, smooth animated tooltips, numbers that count up rather than snap
- Tables: hairline row separators, hover-highlight rows, sticky header on scroll, comfortable row height
- Navigation: clear active-state indicator (e.g. animated underline or pill background that slides between items), collapsible sidebar with smooth width transition if applicable

### MOTION & ANIMATION SPEC (this is the most important part — make it exceptional)

- Animate only `transform` and `opacity` for performance — never animate `width`/`height`/`top`/`left`/`box-shadow` directly per-frame
- Entrance easing: `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) for a premium "settle into place" feel; UI-state easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Durations: micro-interactions (hover/click/toggle) 150–250ms; component transitions (modal open, tab switch) 250–400ms; page/section reveal 400–700ms — nothing should ever feel sluggish
- **Page load**: staggered fade-in-up for cards/sections (30–60ms stagger between siblings) — content should feel like it's assembling itself elegantly, not popping in all at once
- **Scroll reveals**: fade+rise once per element as it enters viewport (if there are scrollable sections)
- **Every interactive element** must have a considered hover/focus/active transition — zero instant, un-animated state changes anywhere
- **Charts**: animate in on mount (draw path / grow bars / fade+scale), animate on data change (numbers count up/down, not jump)
- **Navigation transitions**: active tab/route indicator should slide/morph to the new position rather than snap
- **Modals/dropdowns/tooltips**: scale+fade in from origin point, not just opacity fade
- **Loading states**: skeleton loaders shaped like the real content, subtle shimmer animation — never a blank screen or plain spinner
- Respect `prefers-reduced-motion` — provide a reduced-motion fallback (crossfade only, no movement) for accessibility

### QUALITY BAR / WHAT TO AVOID

- Avoid: generic Bootstrap/Material-default look, mismatched corner radii, inconsistent shadow styles, neon-overload, more than one accent color competing for attention, animations that exist "just because" rather than to clarify what's happening
- Every animation should have a *purpose*: guide attention, communicate state change, or add a moment of delight — not just movement for movement's sake
- The bar: if a senior designer from Linear or Vercel looked at this, they should not be able to tell it was AI-generated in one shot — it should look deliberate, considered, and original

### PROCESS

1. First, propose the overall direction: navigation pattern, color palette (with hex values), font choices, and 2–3 reference mockup descriptions of the key screens — get my confirmation before building.
2. Propose the full design token set (colors, spacing scale, radius scale, shadow scale, type scale, motion timing values) as a single source of truth (e.g. CSS variables or a theme file) — get my confirmation.
3. Rebuild section by section (navigation → dashboard home/overview → key data views/charts → tables → modals/secondary flows), showing me each part before moving to the next, so I can give feedback early rather than after everything is built.
4. After each section, briefly confirm: all original data/features for that section are still present and working.
5. At the end, do a final pass purely for animation polish — go through every interactive element and make sure it has a deliberate transition.

---

## How to run this with Gemini AI

1. Paste this whole prompt as your first message once you've shared/opened the dashboard project with Gemini.
2. Let it give you the **direction proposal** (colors, fonts, layout pattern) first — react to that before it starts building. This is the cheapest point to redirect if the direction feels off.
3. Approve the **design tokens** next — this is your single most important checkpoint, since everything downstream depends on it.
4. Go screen-by-screen / section-by-section rather than asking for the whole thing at once — better output quality, easier to catch issues early.
5. If any output feels generic or "templated," tell Gemini explicitly: *"This looks like a default AI-generated dashboard template — push the typography, spacing, and motion further, be more original and considered, reference the restraint of Linear and the tactility of Apple."* Specific pushback like this gets much better results than "make it better."
6. Test functionality after each section (click through, check data loads) before moving forward — even with full redesign freedom, you don't want to lose working features.
