"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Hand } from "lucide-react";

interface IdleOverlayProps {
  idleTimeout?: number; // seconds before showing overlay
  warningTimeout?: number; // seconds to show warning before redirect
  onTimeout?: () => void;
  isArabic?: boolean;
  children?: React.ReactNode;
}

export function IdleOverlay({
  idleTimeout = 120,
  warningTimeout = 30,
  onTimeout,
  isArabic = false,
  children,
}: IdleOverlayProps) {
  const [isIdle, setIsIdle] = useState(false);
  const [countdown, setCountdown] = useState(warningTimeout);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setIsIdle(false);
    setCountdown(warningTimeout);
  }, [warningTimeout]);

  // Activity listeners
  useEffect(() => {
    const events = ["mousedown", "touchstart", "keydown", "mousemove"];

    const handleActivity = () => {
      if (!isIdle) {
        setLastActivity(Date.now());
      }
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isIdle]);

  // Check for idle
  useEffect(() => {
    const checkIdle = setInterval(() => {
      const idleTime = (Date.now() - lastActivity) / 1000;
      if (idleTime >= idleTimeout && !isIdle) {
        setIsIdle(true);
        setCountdown(warningTimeout);
      }
    }, 1000);

    return () => clearInterval(checkIdle);
  }, [lastActivity, idleTimeout, warningTimeout, isIdle]);

  // Countdown when idle
  useEffect(() => {
    if (!isIdle) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isIdle, onTimeout]);

  if (!isIdle) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center",
          "bg-black/80 backdrop-blur-sm",
          "animate-in fade-in duration-300"
        )}
        onClick={resetTimer}
        onTouchStart={resetTimer}
      >
        <div className="text-center text-white space-y-8 p-8">
          <div className="animate-bounce">
            <Hand className="h-24 w-24 mx-auto" strokeWidth={1.5} />
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-bold">
              {isArabic ? "هل أنت هنا؟" : "Are you still there?"}
            </h2>
            <p className="text-2xl text-gray-300">
              {isArabic
                ? "المس الشاشة للاستمرار"
                : "Touch the screen to continue"}
            </p>
          </div>

          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(countdown / warningTimeout) * 283} 283`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-bold">{countdown}</span>
            </div>
          </div>

          <p className="text-xl text-gray-400">
            {isArabic
              ? `سيتم إنهاء الجلسة خلال ${countdown} ثانية`
              : `Session will end in ${countdown} seconds`}
          </p>
        </div>
      </div>
    </>
  );
}
