/**
 * BunnyPlayer.tsx - Bunny Stream player.
 * Thin wrapper around GenericEmbedPlayer with Bunny-specific embed URL construction.
 * Progress tracking: visible-tab session timer (cannot detect in-player pause without Bunny SDK).
 */
import React from "react"
import GenericEmbedPlayer from "./GenericEmbedPlayer"
import type { PlayerProps } from "./shared"
import { VIDEO_PROVIDERS } from "@/lib/videoProviders"

const bunnyProvider = VIDEO_PROVIDERS.find((p) => p.name === "bunny")!

export default function BunnyPlayer(props: PlayerProps) {
  return (
    <GenericEmbedPlayer
      {...props}
      providerLabel="Bunny Stream"
      embedUrl={bunnyProvider.getEmbedUrl(props.videoUrl, props.initialSeekSeconds ?? 0)}
    />
  )
}
