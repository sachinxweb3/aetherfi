"use client";

import FlowCanvas from "./FlowCanvas";

export default function FlowHero() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-4">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-500/10 via-violet-500/10 to-transparent blur-3xl" />

      <div className="overflow-hidden rounded-[36px] border border-white/20 bg-white/70 shadow-[0_30px_100px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-neutral-900/70">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-8 py-6 dark:border-white/10">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-blue-600">
              AETHER Journey
            </p>

            <h3 className="mt-2 text-2xl font-bold tracking-tight">
              Financial Workflow Engine
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create • Visualize • Execute intelligent financial workflows with
              a modern visual canvas.
            </p>
          </div>

          <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
            <span className="text-sm font-semibold text-emerald-600">
              Live Demo
            </span>
          </div>
        </div>

        {/* Canvas */}
        <div className="p-8">
          <FlowCanvas />
        </div>
      </div>
    </section>
  );
}