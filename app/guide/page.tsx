"use client";

import { useFlightData } from "../hooks/useFlightData";
import { AirportAndGuideSection } from "../components/AirportAndGuideSection";

function GuideContent({ logs }: { logs: ReturnType<typeof useFlightData>["logs"] }) {
  return <AirportAndGuideSection logs={logs} />;
}

export default function GuidePage() {
  const { logs } = useFlightData();

  return (
    <main className="min-h-screen bg-[#F4F7FB] text-slate-900 pb-28 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-6 space-y-5">
        <GuideContent logs={logs} />
      </div>
    </main>
  );
}
