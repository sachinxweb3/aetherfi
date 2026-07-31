"use client"

import * as React from "react"
import { Renderer, Program, Mesh, Triangle } from "ogl"
import { seedFromAddress } from "@/lib/aura"

/**
 * AuraCanvas — the signature piece of AetherFi.
 *
 * A wallet's address is hashed into a deterministic 4-number seed, so every
 * wallet renders a UNIQUE, reproducible plasma "aura". On-chain stats drive the
 * look: energy (score), density (tx), pulse (balance), rings (age). Same wallet
 * always yields the same art — an ownable, shareable on-chain identity.
 *
 * 100% free: one fullscreen fragment shader, no assets, no network, GPU-light.
 * Falls back gracefully (renders nothing) if WebGL is unavailable.
 */

export interface AuraParams {
  /** 0..1 energy — from score/1000 */
  energy?: number
  /** 0..1 particle density — from tx count */
  density?: number
  /** 0..1 core pulse — from balance */
  pulse?: number
  /** 0..1 ring count — from wallet age */
  rings?: number
}

const VERT = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

// Domain-warped fbm plasma. Palette + warp are steered by uSeed so each wallet
// gets a distinct color story; uParams pushes energy/density/pulse/rings.
const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uRes;
  uniform vec4  uSeed;    // deterministic per-wallet
  uniform vec4  uParams;  // energy, density, pulse, rings
  uniform float uIntro;   // 0..1 ignition on mount

  // hash / noise
  float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.));
    vec2 u=f*f*(3.-2.*f);
    return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
  }
  float fbm(vec2 p){
    float v=0., a=0.5;
    for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=0.5; }
    return v;
  }

  // seed-driven palette
  vec3 palette(float t, vec3 base){
    vec3 a=vec3(0.5), b=vec3(0.5);
    vec3 c=vec3(1.0,1.0,1.0);
    vec3 d=base;
    return a+b*cos(6.28318*(c*t+d));
  }

  void main(){
    vec2 uv=(vUv*2.0-1.0);
    uv.x*=uRes.x/uRes.y;

    float energy  = uParams.x;
    float density = uParams.y;
    float pulse   = uParams.z;
    float ringN   = uParams.w;

    float t = uTime*0.06*(0.6+energy*0.8);

    // seed offsets the noise field so wallets diverge
    vec2 q = uv*(1.2+density*1.6) + vec2(uSeed.x*10.0, uSeed.y*10.0);

    // domain warp
    vec2 w = vec2(fbm(q+t), fbm(q-t+3.1));
    float n = fbm(q + w*1.8 + uSeed.zw*4.0);

    // radial core pulse
    float r = length(uv);
    float core = smoothstep(1.1, 0.0, r);
    float beat = 0.85 + 0.15*sin(uTime*(1.5+pulse*2.5));
    core *= 0.6 + pulse*0.9*beat;

    // orbit rings from wallet age
    float rings = 0.0;
    float rc = floor(1.0 + ringN*4.0);
    rings = 0.5+0.5*sin(r*rc*6.2831 - uTime*0.8);
    rings *= smoothstep(1.2,0.2,r)*0.25*ringN;

    float shape = n*0.9 + core + rings;

    // seed → hue base
    vec3 base = vec3(0.55+uSeed.x*0.25, 0.45+uSeed.y*0.3, 0.75+uSeed.z*0.2);
    vec3 col = palette(shape + t*0.4, base);

    // brand tint toward violet/cyan, scaled by energy
    vec3 brand = mix(vec3(0.49,0.36,1.0), vec3(0.13,0.83,0.93), n);
    col = mix(col, brand, 0.45);
    col *= 0.35 + energy*0.9;

    // vignette + core glow
    col += core*vec3(0.4,0.35,0.7)*0.6;
    col *= smoothstep(1.6, 0.1, r);

    // ignition reveal
    col *= smoothstep(0.0, 1.0, uIntro);
    float grain = (hash(vUv*uRes+uTime)-0.5)*0.03;
    gl_FragColor = vec4(col+grain, 1.0);
  }
`

export function AuraCanvas({
  address,
  params,
  className,
  intense = false,
}: {
  address?: string | null
  params?: AuraParams
  className?: string
  intense?: boolean
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  // keep latest params without recreating the GL context
  const paramRef = React.useRef<AuraParams>(params ?? {})
  paramRef.current = params ?? {}
  const seedRef = React.useRef(seedFromAddress(address))
  seedRef.current = seedFromAddress(address)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    let renderer: Renderer
    try {
      renderer = new Renderer({ alpha: false, antialias: false, dpr: Math.min(1.5, window.devicePixelRatio || 1) })
    } catch {
      return // no WebGL → CSS aurora fallback stays visible
    }
    const gl = renderer.gl
    gl.clearColor(0.02, 0.02, 0.06, 1)
    el.appendChild(gl.canvas)
    gl.canvas.style.width = "100%"
    gl.canvas.style.height = "100%"
    gl.canvas.style.display = "block"

    const geometry = new Triangle(gl)
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uRes: { value: [1, 1] },
        uSeed: { value: seedRef.current },
        uParams: { value: [0.4, 0.3, 0.3, 0.3] },
        uIntro: { value: 0 },
      },
    })
    const mesh = new Mesh(gl, { geometry, program })

    function resize() {
      const w = el!.clientWidth || window.innerWidth
      const h = el!.clientHeight || window.innerHeight
      renderer.setSize(w, h)
      program.uniforms.uRes.value = [gl.canvas.width, gl.canvas.height]
    }
    resize()
    window.addEventListener("resize", resize)

    const start = performance.now()
    let raf = 0
    let running = true
    const onVis = () => (running = document.visibilityState === "visible")
    document.addEventListener("visibilitychange", onVis)

    function frame(now: number) {
      raf = requestAnimationFrame(frame)
      if (!running) return
      const t = (now - start) / 1000
      const p = paramRef.current
      const cur = program.uniforms.uParams.value as number[]
      // ease toward target for smooth transitions when data loads
      const tgt = [
        p.energy ?? 0.4,
        p.density ?? 0.3,
        p.pulse ?? 0.3,
        p.rings ?? 0.3,
      ]
      for (let i = 0; i < 4; i++) cur[i] += (tgt[i] - cur[i]) * 0.03
      program.uniforms.uTime.value = t * (intense ? 1.3 : 1)
      program.uniforms.uSeed.value = seedRef.current
      const introV = program.uniforms.uIntro as { value: number }
      introV.value = Math.min(1, introV.value + 0.02)
      renderer.render({ scene: mesh })
    }
    raf = requestAnimationFrame(frame)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      document.removeEventListener("visibilitychange", onVis)
      const ext = gl.getExtension("WEBGL_lose_context")
      ext?.loseContext()
      if (gl.canvas.parentNode === el) el.removeChild(gl.canvas)
    }
  }, [intense])

  return <div ref={ref} className={className} aria-hidden />
}
