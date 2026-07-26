"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AnnouncementBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
      }}
      className="flex justify-center"
    >
      <Badge
        variant="secondary"
        className="rounded-full border border-border/60 bg-background/70 px-5 py-2 text-sm font-medium backdrop-blur-md transition-all duration-300 hover:scale-105"
      >
        <Sparkles className="mr-2 h-4 w-4 text-blue-500" />

        Built for the next generation of financial experiences
      </Badge>
    </motion.div>
  );
}