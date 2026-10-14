"use client";

import Link from "next/link";
import Image from "next/image";

export default function SfcGuideHeroCard() {
  return (
    <Link
      href="/guide"
      className="group relative block w-full h-44 sm:h-48 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
    >
      {/* ラウンジ写真の背景 */}
      <div className="absolute inset-0">
        <Image
          src="/images/lounge.jpg"
          alt="ANA ラウンジ"
          fill
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        {/* ダークグラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1428] via-[#0A1428]/60 to-transparent" />
      </div>

      {/* テキストコンテンツ */}
      <div className="absolute inset-0 p-5 flex flex-col justify-between text-white z-10">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-[10px] font-bold tracking-wider uppercase">
            <span>✨</span> SFC修行ガイド
          </span>
          <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-sm font-bold group-hover:translate-x-1 transition-transform">
            →
          </span>
        </div>

        <div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-white drop-shadow-sm">
            SFC完全ガイド 2026
          </h3>
          <p className="text-xs text-white/80 mt-1 leading-relaxed line-clamp-2">
            制度・達成条件・おすすめルート / ラウンジ・クレジットカードまで網羅
          </p>
        </div>
      </div>
    </Link>
  );
}
