"use client";

import { Suspense } from "react";
import { useFlightData } from "../hooks/useFlightData";
import { AirportAndGuideSection } from "../components/AirportAndGuideSection";

function GuideContent({ logs }: { logs: ReturnType<typeof useFlightData>["logs"] }) {
  return <AirportAndGuideSection logs={logs} />;
}

export default function GuidePage() {
  const { logs } = useFlightData();

  return (
    <main className="min-h-screen bg-[#F4F7FB] text-slate-900 pb-28 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] pb-6 space-y-5">
        <Suspense fallback={<div className="min-h-16 rounded-2xl border border-slate-200 bg-white animate-pulse" aria-hidden="true" />}>
          <GuideContent logs={logs} />
        </Suspense>
      </div>
    </main>
  );
}
