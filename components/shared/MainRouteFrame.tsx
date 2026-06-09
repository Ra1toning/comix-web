"use client"

import { motion } from "framer-motion"
import { usePathname } from "next/navigation"

export function MainRouteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <motion.main
      key={pathname}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 pb-28 pt-24 sm:pt-28"
    >
      {children}
    </motion.main>
  )
}
