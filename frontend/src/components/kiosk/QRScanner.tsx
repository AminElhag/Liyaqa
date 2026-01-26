"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Camera, AlertCircle, RefreshCw } from "lucide-react";

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  isArabic?: boolean;
  className?: string;
}

export function QRScanner({
  onScan,
  onError,
  isArabic = false,
  className,
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationId: number;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: 640, height: 480 },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setHasPermission(true);
          setIsScanning(true);
          scanQRCode();
        }
      } catch (err) {
        console.error("Camera error:", err);
        setHasPermission(false);
        const errorMsg = isArabic
          ? "لا يمكن الوصول إلى الكاميرا"
          : "Cannot access camera";
        setError(errorMsg);
        onError?.(errorMsg);
      }
    };

    const scanQRCode = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const scan = () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // In a real implementation, you would use a QR code library like jsQR
          // For demo purposes, we'll simulate scanning
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Placeholder for QR detection
          // const code = jsQR(imageData.data, imageData.width, imageData.height);
          // if (code) {
          //   onScan(code.data);
          //   return;
          // }
        }
        animationId = requestAnimationFrame(scan);
      };

      scan();
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isArabic, onError]);

  // Simulate QR scan for demo (remove in production)
  const simulateScan = () => {
    const demoMemberId = "MEM-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    onScan(demoMemberId);
  };

  const retry = () => {
    setError(null);
    setHasPermission(null);
  };

  if (error || hasPermission === false) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-6 p-8",
          "bg-gray-100 rounded-2xl min-h-[400px]",
          className
        )}
      >
        <AlertCircle className="h-16 w-16 text-red-500" />
        <p className="text-xl text-gray-700 text-center">
          {error || (isArabic ? "لا يمكن الوصول إلى الكاميرا" : "Cannot access camera")}
        </p>
        <button
          onClick={retry}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl",
            "bg-primary text-primary-foreground",
            "hover:bg-primary/90 active:bg-primary/80",
            "transition-all touch-manipulation"
          )}
        >
          <RefreshCw className="h-5 w-5" />
          {isArabic ? "إعادة المحاولة" : "Try Again"}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Video Feed */}
      <div className="relative overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          className="w-full aspect-[4/3] object-cover"
          playsInline
          muted
        />

        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Scanning frame */}
          <div className="relative w-64 h-64">
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg" />

            {/* Scanning line animation */}
            {isScanning && (
              <div className="absolute left-0 right-0 h-1 bg-primary animate-scan-line" />
            )}
          </div>
        </div>

        {/* Dark overlay outside scanning area */}
        <div className="absolute inset-0 bg-black/40 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center">
        <p className="text-lg text-gray-600">
          {isArabic
            ? "وجه الكاميرا نحو رمز QR الخاص بك"
            : "Point camera at your QR code"}
        </p>
      </div>

      {/* Demo button (remove in production) */}
      <button
        onClick={simulateScan}
        className={cn(
          "mt-4 w-full py-3 rounded-xl text-lg",
          "bg-gray-200 text-gray-700 hover:bg-gray-300",
          "transition-all touch-manipulation"
        )}
      >
        {isArabic ? "تجربة المسح (للتطوير)" : "Simulate Scan (Dev)"}
      </button>

      <style jsx>{`
        @keyframes scan-line {
          0% {
            top: 0;
          }
          50% {
            top: calc(100% - 4px);
          }
          100% {
            top: 0;
          }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
