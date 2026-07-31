# AetherFi Aura — "00 → 101" Roadmap

> Goal: Arc judges ne 00 diya. Ab aisa banao ki impossible lage — **par 100% free, zero paid API, kam GPU.**
> Core bet: **wallet ka on-chain data hi generative art ban jaye.** Koi aur ye nahi karta.

---

## 🧬 The Big Idea — "Your wallet is a living organism"

Har wallet ka ek **unique procedural aura** — ek jeevit, saans leta huआ shader jeeva
jo *us wallet ke asli data se* generate hota hai. Do wallet kabhi same nahi dikhenge.

- Score → aura ki energy/brightness
- Tx count → particle density
- Balance → core ka size/pulse
- Wallet age → orbit rings
- Activity pattern (14-day) → flare rhythm

Ye "seeded generative identity" hai. Address ko seed banao → deterministic art.
**Same wallet = same aura hamesha** (isliye shareable & ownable feel deta hai).

Free kyun: pure GLSL/canvas math, koi asset download nahi, koi API nahi.

---

## 🎯 Phase 1 — The Impossible Hero (max wow, min cost)

**"Aura Genesis" landing**
- [ ] Fullscreen **shader aura** background — flowing plasma/nebula, GPU-cheap fragment shader (single quad, no 3D models). Falls back to CSS gradient on weak devices.
- [ ] **Custom magnetic cursor** — small glow dot jo buttons ki taraf khinchta hai (pure CSS/JS, ~30 lines).
- [ ] **Cinematic intro** — 1.2s "AETHERFI" letter-reveal + aura ignite. Skippable. (Framer Motion, already installed.)
- [ ] **Scroll-as-reveal** — hero text depth-parallax; connect CTA magnetic.
- [ ] **Numbered index nav** (`01 Reveal · 02 Leaderboard · 03 About`) — studio-grade detail.
- [ ] **Sound toggle** (optional ambient hum via Web Audio oscillator — zero file, generated live). Off by default.

## 🎯 Phase 2 — The Reveal Moment (the "101" hook)

Wallet connect ke baad ek **transformation animation** — abstract aura → tumhara personal aura.
- [ ] Connect → screen "charges" → address-seeded aura **materializes** with your real stats flying in.
- [ ] Score ring redesign: liquid-fill + particle burst on final number.
- [ ] Stats count-up already hai → add **magnetic tilt cards** (mouse-follow 3D tilt, pure CSS transform).

## 🎯 Phase 3 — Dashboard as Art Gallery

- [ ] Each section = "exhibit" with scroll-snap + reveal.
- [ ] Activity chart → **animated waveform** (not boring bars) driven by real 14-day data.
- [ ] Badges → glass cards with holographic sheen on hover (CSS conic-gradient).
- [ ] **Live rank ticker** — leaderboard position animates.

## 🎯 Phase 4 — Viral "Aura Card" (the free growth engine)

- [ ] Downloadable **animated aura** as the share centerpiece.
- [ ] OG image upgraded: render the wallet's *actual seeded aura* into the PNG (Satori can't shader, so pre-bake a canvas snapshot → dataURL passed to OG). Every share = unique art.
- [ ] "Mint-less NFT feel" — card looks collectible without any chain write (free).

## 🎯 Phase 5 — Impossible-but-free extras (easter eggs judges love)

- [ ] **Playable 404** (studios do this — cheap, memorable).
- [ ] **Konami code** → secret "god mode" aura theme.
- [ ] **Wallet personality → generated ambient sound** (Web Audio, data-seeded melody). No files.
- [ ] **/w/[address] deep pages** already exist → make each a mini shareable gallery.

---

## 🚫 Deliberately NOT doing (stay free + fast)
- No 3D models / GLTF (heavy download)
- No paid AI — rule-based personality stays, upgrade-ready
- No WalletConnect dependency — injected wallets only (reown down anyway)
- No video files — everything generated in-browser

## ✅ Tech (all already installed / free)
Next.js · wagmi + RainbowKit (injected) · Framer Motion · GLSL via raw canvas/WebGL
(no new heavy deps — maybe `ogl` ~10kb if we want cleaner shader setup, else raw WebGL)

## 📐 Execution order (kam token, high impact first)
1. Shader aura hero + custom cursor + intro   ← biggest visual jump
2. Seeded-aura generator (the unique tech)      ← the "nobody did this" moat
3. Reveal transition + tilt cards
4. Dashboard-as-gallery polish
5. Aura share card + OG bake
6. Easter eggs
