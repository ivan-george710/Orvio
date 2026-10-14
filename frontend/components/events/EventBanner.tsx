"use client";

import Image from "next/image";
import { useState } from "react";
import { bannerPathFromUrl } from "@/lib/event-metadata";

function BannerImage({ url, title, compact }: { url: string; title: string; compact: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className={compact
      ? "relative -mx-6 -mt-6 mb-6 aspect-[16/9] overflow-hidden rounded-t-xl bg-secondary"
      : "relative mt-8 aspect-[16/9] overflow-hidden rounded-xl bg-secondary"}>
      <Image src={url} alt={`${title} event banner`} fill unoptimized
        sizes={compact ? "(max-width: 768px) 100vw, 33vw" : "100vw"}
        className="object-cover" onError={() => setFailed(true)} />
    </div>
  );
}

export default function EventBanner({ url, title, compact = false }: {
  url?: string | null; title: string; compact?: boolean;
}) {
  if (!bannerPathFromUrl(url, process.env.NEXT_PUBLIC_SUPABASE_URL)) return null;
  return <BannerImage key={url} url={url!} title={title} compact={compact} />;
}
