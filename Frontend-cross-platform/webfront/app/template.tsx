"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "../lib/motion/useReducedMotion";

/** Transition douce entre les pages (un template est recréé à chaque navigation). */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
