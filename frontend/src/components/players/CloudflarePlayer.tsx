/**
 * CloudflarePlayer.tsx - Cloudflare Stream player.
 * Thin wrapper around GenericEmbedPlayer with Cloudflare-specific embed URL construction.
 * Progress tracking: visible-tab session timer (cannot detect in-player pause without CF SDK).
 */
import React from "react"
import GenericEmbedPlayer from "./GenericEmbedPlayer"
import type { PlayerProps } from "./shared"
import { VIDEO_PROVIDERS } from "@/lib/videoProviders"

const cfProvider = VIDEO_PROVIDERS.find((p) => p.name === "cloudflare")!

export default function CloudflarePlayer(props: PlayerProps) {
  return (
    <GenericEmbedPlayer
      {...props}
      providerLabel="Cloudflare Stream"
      embedUrl={cfProvider.getEmbedUrl(props.videoUrl, props.initialSeekSeconds ?? 0)}
    />
  )
}
