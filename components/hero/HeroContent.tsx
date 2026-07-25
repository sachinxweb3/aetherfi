"use client";

import { motion } from "framer-motion";

export default function HeroContent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7,
        ease: "easeOut",
        delay: 0.15,
      }}
      className="mx-auto max-w-5xl text-center"
    >
      <h1 className="text-balance text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
        Financial experiences
        <span className="block bg-gradient-to-r from-blue-600 via-violet-500 to-cyan-500 bg-clip-text text-transparent">
          designed for humans.
        </span>
      </h1>

      <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
        AETHER transforms complex financial interactions into intuitive,
        beautiful experiences that anyone can understand and confidently use.
      </p>
    </motion.div>
  );
}