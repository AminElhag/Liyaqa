"use client";

import { Suspense, useState, useEffect, createContext, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IdleOverlay } from "@/components/kiosk";
import { useKioskDeviceByCode, useStartSession, useSendKioskHeartbeat } from "@liyaqa/shared/queries/use-kiosk";
import type { KioskDevice, KioskSession } from "@liyaqa/shared/types/kiosk";

interface KioskContextType {
  device: KioskDevice | null;
  session: KioskSession | null;
  isArabic: boolean;
  setIsArabic: (value: boolean) => void;
  startNewSession: () => Promise<KioskSession | null>;
  endCurrentSession: () => void;
}

const KioskContext = createContext<KioskContextType | null>(null);

export function useKiosk() {
  const context = useContext(KioskContext);
  if (!context) {
    throw new Error("useKiosk must be used within KioskLayout");
  }
  return context;
}

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-primary/5 to-primary/10 flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" /></div>}>
      <KioskLayoutInner>{children}</KioskLayoutInner>
    </Suspense>
  );
}

function KioskLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceCode = searchParams.get("device") || "";

  const [isArabic, setIsArabic] = useState(false);
  const [session, setSession] = useState<KioskSession | null>(null);

  const { data: device, isLoading: deviceLoading } = useKioskDeviceByCode(deviceCode);
  const startSessionMutation = useStartSession();
  const heartbeatMutation = useSendKioskHeartbeat();

  // Send heartbeat every 30 seconds
  useEffect(() => {
    if (!device?.id) return;

    const sendHeartbeat = () => {
      heartbeatMutation.mutate(device.id);
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);

    return () => clearInterval(interval);
  }, [device?.id]);

  const startNewSession = async (): Promise<KioskSession | null> => {
    if (!device?.id) return null;
    try {
      const newSession = await startSessionMutation.mutateAsync({
        kioskId: device.id,
      });
      setSession(newSession);
      return newSession;
    } catch (error) {
      console.error("Failed to start session:", error);
      return null;
    }
  };

  const endCurrentSession = () => {
    setSession(null);
    router.push(`/kiosk?device=${deviceCode}`);
  };

  const handleIdleTimeout = () => {
    endCurrentSession();
  };

  // Show loading while fetching device
  if (deviceLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if no device found
  if (!device && deviceCode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-red-100 flex items-center justify-center p-8">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-5xl">&#10060;</span>
          </div>
          <h1 className="text-3xl font-bold text-red-800">Device Not Found</h1>
          <p className="text-xl text-red-600">
            The kiosk device &quot;{deviceCode}&quot; is not registered.
          </p>
          <p className="text-lg text-red-500">
            Please contact staff for assistance.
          </p>
        </div>
      </div>
    );
  }

  // Show setup screen if no device code
  if (!deviceCode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-primary/10 flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-3xl font-bold text-gray-800">Kiosk Setup</h1>
          <p className="text-xl text-gray-600">
            Add the device code to the URL to activate this kiosk.
          </p>
          <code className="block p-4 bg-gray-100 rounded-xl text-lg">
            /kiosk?device=KIOSK-001
          </code>
        </div>
      </div>
    );
  }

  return (
    <KioskContext.Provider
      value={{
        device: device ?? null,
        session,
        isArabic,
        setIsArabic,
        startNewSession,
        endCurrentSession,
      }}
    >
      <div
        className="min-h-screen bg-gradient-to-b from-primary/5 to-primary/10"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <IdleOverlay
          idleTimeout={session ? 120 : 300}
          warningTimeout={30}
          onTimeout={handleIdleTimeout}
          isArabic={isArabic}
        >
          {children}
        </IdleOverlay>
      </div>
    </KioskContext.Provider>
  );
}
