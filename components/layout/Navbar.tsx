"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Docs", href: "#docs" },
];

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-x-0 top-5 z-50 flex justify-center px-4"
    >
      <div className="w-full max-w-7xl">
        <div className="flex h-16 items-center justify-between rounded-2xl border border-white/10 bg-white/70 px-6 shadow-xl backdrop-blur-2xl dark:bg-neutral-900/70">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            <div className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-40" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
            </div>

            <span className="text-xl font-black tracking-[0.25em] transition-opacity group-hover:opacity-80">
              AETHER
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="relative text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
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
              size="sm"
              className="group rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 text-white shadow-lg transition-shadow duration-300 hover:shadow-[0_18px_40px_rgba(59,130,246,0.35)]"
            >
              <motion.div
                whileHover={{
                  y: -1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 20,
                }}
              >
                <Wallet className="mr-2 h-4 w-4" />
              </motion.div>

              Connect Wallet
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}