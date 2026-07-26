"use client";

import { useWorkflow } from "@/hooks/useWorkflow";
import { motion } from "framer-motion";
import { Activity, Cpu, Fuel, ShieldCheck } from "lucide-react";

export default function SimulationMetrics() {
  const { workflow } = useWorkflow();

  const isRunning = workflow.executionState === "running";

  const completedNodesCount = workflow.nodes.filter(
    (n) => n.state === "success",
  ).length;

  const totalNodesCount = workflow.nodes.length;

  const progressPercentage =
    totalNodesCount > 0
      ? Math.round((completedNodesCount / totalNodesCount) * 100)
      : 0;

  const estimatedGas = (completedNodesCount * 0.00042).toFixed(4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/70 p-4 shadow-lg backdrop-blur-xl dark:bg-neutral-900/70"
    >
      {/* Network Status */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Cpu className="h-5 w-5" />
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Target Network
          </p>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />

            <p className="text-sm font-bold text-foreground">
              Arc Testnet
            </p>
          </div>
        </div>
      </div>

      <div className="hidden h-8 w-px bg-border/60 sm:block" />

      {/* Gas Cost Indicator */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Fuel className="h-5 w-5" />
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Simulated Gas
          </p>

          <p className="font-mono text-sm font-bold text-foreground">
            {estimatedGas} ARC
          </p>
        </div>
      </div>

      <div className="hidden h-8 w-px bg-border/60 sm:block" />

      {/* Latency */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
          <Activity className="h-5 w-5" />
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Block Latency
          </p>

          <p className="text-sm font-bold text-foreground">32 ms</p>
        </div>
      </div>

      <div className="hidden h-8 w-px bg-border/60 sm:block" />

      {/* Execution Progress */}
      <div className="min-w-[200px] flex-1">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Execution Pipeline
          </span>

          <span className="font-mono text-foreground">
            {completedNodesCount} / {totalNodesCount} Steps (
            {progressPercentage}%)
          </span>
        </div>

        {/* Progress Track */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-neutral-800">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}