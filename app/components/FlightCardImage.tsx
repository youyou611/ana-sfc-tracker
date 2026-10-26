"use client";

import { useEffect, useState } from "react";
import { FlightLogEx } from "../types";
import { getImage } from "../lib/db";

export default function FlightCardImage({ log, generatedImage }: { log: FlightLogEx; generatedImage: string }) {
  const [photoOverride, setPhotoOverride] = useState<{ imageId: string; src: string } | null>(null);
  useEffect(() => {
    let active = true;
    const imageId = log.imageId;
    if (imageId) getImage(imageId).then((image) => { if (active && image) setPhotoOverride({ imageId, src: image }); });
    return () => { active = false; };
  }, [log.imageId]);
  const src = log.imageId && photoOverride?.imageId === log.imageId ? photoOverride.src : generatedImage;
  return <img src={src} alt={`${log.aircraftType || "航空機"}のイメージ`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />;
}
