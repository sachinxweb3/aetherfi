import { describe, it, expect } from "vitest"
import {
  isMotionPref,
  resolveReducedMotion,
  isAetherKey,
  summarizeData,
  aetherKeys,
  MOTION_KEY,
  SOUND_KEY,
} from "../lib/prefs"

// Pure preferences core (File 05 accessibility, File 16 honesty). The Privacy
// panel enumerates only real keys, and clearing touches only AETHER's own data.

describe("motion preference", () => {
  it("validates the allowed values", () => {
    expect(isMotionPref("system")).toBe(true)
    expect(isMotionPref("reduce")).toBe(true)
    expect(isMotionPref("full")).toBe(true)
    expect(isMotionPref("nope")).toBe(false)
    expect(isMotionPref(null)).toBe(false)
  })

  it("lets an explicit choice override the OS setting", () => {
    // reduce always reduces; full never reduces — regardless of the OS.
    expect(resolveReducedMotion("reduce", false)).toBe(true)
    expect(resolveReducedMotion("full", true)).toBe(false)
  })

  it("defers to the OS when set to system", () => {
    expect(resolveReducedMotion("system", true)).toBe(true)
    expect(resolveReducedMotion("system", false)).toBe(false)
  })
})

describe("data ownership", () => {
  it("recognizes AETHER's own keys, including prefixed ones", () => {
    expect(isAetherKey(MOTION_KEY)).toBe(true)
    expect(isAetherKey(SOUND_KEY)).toBe(true)
    expect(isAetherKey("af_god")).toBe(true)
    expect(isAetherKey("af_boost_0xabc")).toBe(true)
    expect(isAetherKey("aether.portfolio.snap.0xabc")).toBe(true)
  })

  it("never claims unrelated third-party keys", () => {
    expect(isAetherKey("theme")).toBe(false)
    expect(isAetherKey("wagmi.store")).toBe(false)
    expect(isAetherKey("some_other_app")).toBe(false)
  })

  it("clears only AETHER keys from a mixed store", () => {
    const keys = [MOTION_KEY, "af_god", "af_boost_0x1", "wagmi.store", "theme", "aether.portfolio.snap.0x2"]
    expect(aetherKeys(keys).sort()).toEqual(
      [MOTION_KEY, "af_god", "af_boost_0x1", "aether.portfolio.snap.0x2"].sort(),
    )
  })
})

describe("summarizeData", () => {
  it("counts live keys per entry and lists every entry", () => {
    const keys = [MOTION_KEY, "af_boost_0x1", "af_boost_0x2", "wagmi.store"]
    const rows = summarizeData(keys)
    const motion = rows.find((r) => r.id === "motion")!
    const boost = rows.find((r) => r.id === "boost")!
    const sound = rows.find((r) => r.id === "sound")!
    expect(motion.count).toBe(1)
    expect(boost.count).toBe(2)
    expect(sound.count).toBe(0) // listed even when empty, honestly
    expect(rows.length).toBeGreaterThanOrEqual(6)
  })
})
