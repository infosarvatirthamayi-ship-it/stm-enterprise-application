import React from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion"; // 🎯 FIX: Added missing AnimatePresence import
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors focus:outline-none"
      aria-label="Toggle theme mode"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDarkMode ? "dark" : "light"}
          initial={{ y: -10, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 10, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-center"
        >
          {/* 🎯 THE CRITICAL FIX: Render Moon when Dark is active, Sun when Light is active */}
          {isDarkMode ? (
            <FiMoon size={19} className="text-purple-400 fill-purple-400/20" />
          ) : (
            <FiSun size={19} className="text-amber-500 fill-amber-500/20" />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}