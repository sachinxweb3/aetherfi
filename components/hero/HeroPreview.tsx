"use client";

import { motion } from "framer-motion";
import {
  ArrowDown,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const steps = [
  "Initialize Flow",
  "Verify",
  "Execute",
  "Completed",
];

export default function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.7,
        delay: 0.45,
      }}
      className="mt-16 w-full max-w-xl"
    >
      <Card className="rounded-3xl border-border/60 bg-background/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Live Session
            </p>

            <h3 className="text-xl font-semibold">
              Mission Control
            </h3>
          </div>

          <ShieldCheck className="h-8 w-8 text-emerald-500" />
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step}
              className="flex flex-col items-center"
            >
              <div className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-muted/40 px-4 py-3">
                <span>{step}</span>

                {step === "Completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                )}
              </div>

              {index !== steps.length - 1 && (
                <ArrowDown className="my-2 h-5 w-5 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between rounded-2xl bg-muted/50 p-4">
          <span className="text-sm text-muted-foreground">
            Confidence Score
          </span>

          <span className="text-2xl font-bold text-emerald-500">
            98%
          </span>
        </div>
      </Card>
    </motion.div>
  );
}