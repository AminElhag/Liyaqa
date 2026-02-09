import type { Variants } from 'framer-motion'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches
}

function safeDistance(distance: number): number {
  return prefersReducedMotion() ? 0 : distance
}

function safeDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: safeDuration(0.3) } },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: safeDistance(20) },
  visible: { opacity: 1, y: 0, transition: { duration: safeDuration(0.4) } },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: safeDistance(-20) },
  visible: { opacity: 1, y: 0, transition: { duration: safeDuration(0.4) } },
}

export function fadeInLeft(dir: 'ltr' | 'rtl' = 'ltr'): Variants {
  const x = dir === 'rtl' ? safeDistance(20) : safeDistance(-20)
  return {
    hidden: { opacity: 0, x },
    visible: { opacity: 1, x: 0, transition: { duration: safeDuration(0.4) } },
  }
}

export function fadeInRight(dir: 'ltr' | 'rtl' = 'ltr'): Variants {
  const x = dir === 'rtl' ? safeDistance(-20) : safeDistance(20)
  return {
    hidden: { opacity: 0, x },
    visible: { opacity: 1, x: 0, transition: { duration: safeDuration(0.4) } },
  }
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: prefersReducedMotion() ? 1 : 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: safeDuration(0.3) } },
}

export function slideIn(dir: 'ltr' | 'rtl' = 'ltr'): Variants {
  const x = dir === 'rtl' ? safeDistance(40) : safeDistance(-40)
  return {
    hidden: { opacity: 0, x },
    visible: { opacity: 1, x: 0, transition: { duration: safeDuration(0.4), ease: 'easeOut' } },
  }
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: prefersReducedMotion() ? 0 : 0.05,
      delayChildren: prefersReducedMotion() ? 0 : 0.1,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: safeDistance(10) },
  visible: { opacity: 1, y: 0, transition: { duration: safeDuration(0.3) } },
}

export const pageTransition: Variants = {
  initial: { opacity: 0, y: safeDistance(8) },
  animate: { opacity: 1, y: 0, transition: { duration: safeDuration(0.3), ease: 'easeOut' } },
  exit: { opacity: 0, y: safeDistance(-8), transition: { duration: safeDuration(0.2) } },
}
