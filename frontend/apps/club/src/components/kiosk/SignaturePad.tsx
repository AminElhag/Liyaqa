"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@liyaqa/shared/utils";
import { Eraser, Check, RotateCcw } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange?: (dataUrl: string | null) => void;
  onSubmit?: (dataUrl: string) => void;
  width?: number;
  height?: number;
  penColor?: string;
  backgroundColor?: string;
  isArabic?: boolean;
  className?: string;
}

export function SignaturePad({
  onSignatureChange,
  onSubmit,
  width = 600,
  height = 300,
  penColor = "#000000",
  backgroundColor = "#ffffff",
  isArabic = false,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const getCoordinates = useCallback(
    (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        const touch = e.touches[0];
        if (!touch) return null;
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      const coords = getCoordinates(e);
      if (!coords) return;

      setIsDrawing(true);
      lastPosRef.current = coords;
    },
    [getCoordinates]
  );

  const draw = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDrawing) return;
      e.preventDefault();

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const coords = getCoordinates(e);

      if (!ctx || !coords || !lastPosRef.current) return;

      ctx.beginPath();
      ctx.strokeStyle = penColor;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();

      lastPosRef.current = coords;
      setHasSignature(true);
    },
    [isDrawing, penColor, getCoordinates]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPosRef.current = null;

    if (hasSignature && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      onSignatureChange?.(dataUrl);
    }
  }, [hasSignature, onSignatureChange]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange?.(null);
  }, [backgroundColor, onSignatureChange]);

  const handleSubmit = useCallback(() => {
    if (!hasSignature || !canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onSubmit?.(dataUrl);
  }, [hasSignature, onSubmit]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [backgroundColor]);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative rounded-xl overflow-hidden border-4 border-gray-300 bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="touch-none cursor-crosshair"
          style={{ width: `${width}px`, height: `${height}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Signature line */}
        <div
          className="absolute bottom-12 left-8 right-8 border-b-2 border-gray-300 border-dashed"
          style={{ pointerEvents: "none" }}
        />

        {/* X mark */}
        <div
          className="absolute bottom-10 left-6 text-gray-400 text-2xl font-serif"
          style={{ pointerEvents: "none" }}
        >
          ×
        </div>

        {/* Placeholder text */}
        {!hasSignature && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <p className="text-gray-400 text-xl">
              {isArabic ? "وقع هنا" : "Sign here"}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={clearSignature}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl text-lg font-medium",
            "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300",
            "transition-all touch-manipulation"
          )}
        >
          <RotateCcw className="h-5 w-5" />
          {isArabic ? "إعادة" : "Clear"}
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasSignature}
          className={cn(
            "flex items-center gap-2 px-8 py-3 rounded-xl text-lg font-medium",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 active:bg-primary/80",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all touch-manipulation"
          )}
        >
          <Check className="h-5 w-5" />
          {isArabic ? "تأكيد التوقيع" : "Confirm Signature"}
        </button>
      </div>
    </div>
  );
}
