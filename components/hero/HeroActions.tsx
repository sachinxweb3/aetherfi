"use client";

import { motion } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: 0.3,
      }}
      className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
    >
      {/* Primary Action - Launch Experience */}
      <motion.div
        whileHover={{
          y: -2,
          scale: 1.015,
        }}
        whileTap={{
          scale: 0.985,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 22,
        }}
      >
        <Button
          size="lg"
          className="group rounded-xl px-8 py-6 text-base shadow-[0_10px_30px_rgba(15,23,42,0.10)] transition-shadow duration-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
        >
          Launch Experience

          <motion.div
            whileHover={{ x: 3 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
          >
            <ArrowRight className="ml-2 h-5 w-5" />
          </motion.div>
        </Button>
      </motion.div>

      {/* Secondary Action - See How It Works */}
      <motion.div
        whileHover={{
          y: -2,
          scale: 1.01,
        }}
        whileTap={{
          scale: 0.985,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 22,
        }}
      >
        <Button
          variant="outline"
          size="lg"
          className="group rounded-xl px-8 py-6 text-base shadow-sm transition-shadow duration-300 hover:shadow-lg"
        >
          <motion.div
            whileHover={{
              scale: 1.08,
            }}
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 18,
            }}
          >
            <PlayCircle className="mr-2 h-5 w-5" />
          </motion.div>

          See How It Works
        </Button>
      </motion.div>
    </motion.div>
  );
}