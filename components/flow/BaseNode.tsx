"use client";

import { Handle, Position } from "@xyflow/react";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import { FlowNodeData } from "./types/FlowNodeData";

export type NodeVariant =
  | "wallet"
  | "review"
  | "risk"
  | "approval"
  | "success";

interface BaseNodeProps {
  data: FlowNodeData;
  icon: ReactNode;
  accent: string;
  variant?: NodeVariant; // Optional to prevent runtime crashes
}

export default function BaseNode({
  data,
  icon,
  accent,
  variant = "wallet", // Default fallback
}: BaseNodeProps) {
  const variantConfig: Record<
    NodeVariant,
    {
      phase: string;
      status: string;
      badge: string;
      surface: string;
      glow: string;
      iconBackground: string;
    }
  > = {
    wallet: {
      phase: "ENTRY",
      status: "Protected",
      badge: "Wallet",
      surface: "#FFFFFF",
      glow: "#2563EB",
      iconBackground:
        "linear-gradient(180deg,#EFF6FF 0%,#DBEAFE 100%)",
    },
    review: {
      phase: "VERIFY",
      status: "Under Review",
      badge: "Verify",
      surface: "#FFFFFF",
      glow: accent,
      iconBackground: `linear-gradient(180deg,${accent}22 0%,${accent}12 100%)`,
    },
    risk: {
      phase: "ANALYZE",
      status: "AI Scored",
      badge: "Risk",
      surface: "#FFFFFF",
      glow: accent,
      iconBackground: `linear-gradient(180deg,${accent}22 0%,${accent}12 100%)`,
    },
    approval: {
      phase: "AUTHORIZE",
      status: "Pending",
      badge: "Approval",
      surface: "#FFFFFF",
      glow: accent,
      iconBackground: `linear-gradient(180deg,${accent}22 0%,${accent}12 100%)`,
    },
    success: {
      phase: "COMPLETE",
      status: "Completed",
      badge: "Success",
      surface: "#FFFFFF",
      glow: accent,
      iconBackground: `linear-gradient(180deg,${accent}22 0%,${accent}12 100%)`,
    },
  };

  // Safe fallback lookup to ensure currentVariant is never undefined
  const currentVariant = variantConfig[variant] || variantConfig["wallet"];

  // Check state passed dynamically via flow state
  const isActive = data.state === "active";
  const isSuccess = data.state === "success";
  const isSelected = data.selected === true;

  return (
    <motion.div
      whileHover={{
        y: -6,
        scale: 1.018,
      }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 22,
        mass: 0.8,
      }}
      className="group relative min-w-[275px] will-change-transform"
    >
      {/* Ambient Glow */}
      <motion.div
        aria-hidden
        className={`absolute -inset-3 rounded-[34px] blur-3xl transition-all duration-500 ${
          isActive || isSuccess || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        style={{
          background: `radial-gradient(circle at center, ${
            isSelected ? "#8B5CF6" : isSuccess ? "#10B981" : accent
          }28 0%, transparent 72%)`,
        }}
      />

      {/* Premium Card Surface with separated selection and success styling */}
      <div
        style={{
          background: isSuccess ? undefined : currentVariant.surface,
        }}
        className={`relative overflow-hidden rounded-[30px] border shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-3xl transition-all duration-300 ${
          isSuccess
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
            : isActive
              ? "border-blue-500 shadow-lg shadow-blue-500/15 scale-[1.02]"
              : "border-slate-200 dark:border-neutral-700"
        } ${
          isSelected ? "ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-neutral-950" : ""
        }`}
      >
        {/* Glass highlight */}
        <motion.div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
          initial={{ opacity: 0.65 }}
          whileHover={{ opacity: 1 }}
          transition={{
            duration: 0.22,
          }}
        />

        {/* Wallet Top Soft Gradient Overlay */}
        {variant === "wallet" && !isSuccess && (
          <div
            className="absolute inset-x-0 top-0 h-24"
            style={{
              background:
                "linear-gradient(180deg, rgba(37,99,235,0.10) 0%, rgba(37,99,235,0.04) 55%, transparent 100%)",
            }}
          />
        )}

        {/* Accent Glow */}
        <motion.div
          aria-hidden
          className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl"
          style={{
            background: isSuccess ? "#10B981" : accent,
          }}
          initial={false}
          animate={{
            opacity: isActive || isSuccess || isSelected ? 0.35 : 0.18,
            scale: isActive || isSelected ? 1.12 : 1,
          }}
          whileHover={{
            opacity: 0.32,
            scale: 1.12,
          }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 20,
          }}
        />

        {/* Target Connector */}
        <Handle
          type="target"
          position={Position.Top}
          id="target-top"
          className="!h-2.5 !w-2.5 !border-2 !border-white/90 !bg-slate-400 opacity-70 shadow-md transition-all duration-300 group-hover:!h-3 group-hover:!w-3 group-hover:!bg-slate-700 group-hover:opacity-100 group-hover:shadow-[0_0_12px_rgba(59,130,246,0.35)] dark:!bg-slate-300"
        />

        <div className="relative p-6">
          <div className="flex items-center gap-5">
            {/* Icon Surface */}
            <div
              className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/70 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
              style={{
                background: currentVariant.iconBackground,
              }}
            >
              {/* Inner highlight */}
              <div
                className="absolute inset-0 rounded-3xl"
                style={{
                  boxShadow: `inset 0 1px 0 ${accent}55`,
                }}
              />

              {/* Wallet Specific Icon Highlights */}
              {variant === "wallet" && (
                <>
                  <div className="absolute inset-1 rounded-[20px] border border-blue-200/70" />

                  <div
                    className="absolute inset-3 rounded-full blur-xl"
                    style={{
                      background: "rgba(37,99,235,0.18)",
                    }}
                  />
                </>
              )}

              {/* Soft radial */}
              <div
                className="absolute inset-2 rounded-2xl blur-xl"
                style={{
                  background: `${accent}20`,
                }}
              />

              <motion.div
                className="relative z-10"
                style={{
                  color: isSuccess ? "#10B981" : accent,
                }}
                whileHover={{
                  y: -2,
                  scale: 1.06,
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 18,
                }}
              >
                {icon}
              </motion.div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    background: isSuccess ? "#10B981" : accent,
                  }}
                />

                <span
                  className="text-[10px] font-semibold tracking-[0.32em] uppercase opacity-80"
                  style={{
                    color: isSuccess ? "#10B981" : accent,
                  }}
                >
                  {currentVariant.phase}
                </span>
              </div>

              <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-foreground">
                {data.title}
              </h3>

              {data.subtitle && (
                <p className="mt-1.5 text-[13px] font-medium leading-5 text-muted-foreground">
                  {data.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Decorative Divider */}
          <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-black/8 to-transparent dark:via-white/10" />

          {/* Bottom Section */}
          <div className="mt-5 flex items-center justify-between">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: isSuccess ? "#10B981" : accent,
                  boxShadow: `0 0 10px ${isSuccess ? "#10B981" : accent}`,
                }}
              />

              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {isSuccess ? "Passed" : currentVariant.status}
              </span>
            </div>

            {/* Accent Badge */}
            <div
              className="rounded-full px-3 py-1 text-[11px] font-semibold text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
              style={{
                background: isSuccess
                  ? "linear-gradient(135deg, #10B981, #059669)"
                  : `linear-gradient(135deg, ${accent}, ${accent}CC)`,
                boxShadow: `0 8px 24px ${isSuccess ? "#10B98133" : `${accent}33`}`,
              }}
            >
              {currentVariant.badge}
            </div>
          </div>

          {/* Bottom Accent Line */}
          <motion.div
            aria-hidden
            className="absolute bottom-0 left-6 right-6 rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${
                isSuccess ? "#10B981" : accent
              } 50%, transparent 100%)`,
            }}
            initial={false}
            animate={{
              height: isActive || isSuccess || isSelected ? 4 : 3,
              opacity: isActive || isSuccess || isSelected ? 1 : 0.8,
            }}
            whileHover={{
              height: 4,
              opacity: 1,
            }}
            transition={{
              type: "spring",
              stiffness: 240,
              damping: 18,
            }}
          />
        </div>

        {/* Source/Output Connector */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="source-bottom"
          className="!h-2.5 !w-2.5 !border-2 !border-white/90 !bg-slate-400 opacity-70 shadow-md transition-all duration-300 group-hover:!h-3 group-hover:!w-3 group-hover:!bg-slate-700 group-hover:opacity-100 group-hover:shadow-[0_0_12px_rgba(59,130,246,0.35)] dark:!bg-slate-300"
        />
      </div>
    </motion.div>
  );
}