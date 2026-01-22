"use client";

import * as React from "react";
import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const hoverVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

interface AnimatedCardProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  /** Delay before animation starts (in seconds) */
  delay?: number;
  /** Whether to animate on hover */
  hoverEffect?: boolean;
  /** Custom animation variants */
  customVariants?: Variants;
}

/**
 * Animated card component with entrance animation and optional hover effects.
 * Wraps content in a motion.div with staggered fade-in animation.
 */
const AnimatedCard = React.forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, children, delay = 0, hoverEffect = true, customVariants, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={customVariants || cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={hoverEffect ? "hover" : undefined}
        transition={{ delay }}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm",
          hoverEffect && "cursor-pointer transition-colors",
          className
        )}
        {...(hoverEffect && { variants: { ...cardVariants, ...hoverVariants } })}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedCard.displayName = "AnimatedCard";

/**
 * Container that staggers child animations.
 * Wrap multiple AnimatedCards in this to get sequential entrance effects.
 */
const AnimatedCardContainer = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div"> & { staggerDelay?: number }
>(({ className, children, staggerDelay = 0.1, ...props }, ref) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
});
AnimatedCardContainer.displayName = "AnimatedCardContainer";

/**
 * Simple child item for use inside AnimatedCardContainer.
 * Automatically inherits stagger timing from parent.
 */
const AnimatedCardItem = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedCardItem.displayName = "AnimatedCardItem";

export { AnimatedCard, AnimatedCardContainer, AnimatedCardItem };
