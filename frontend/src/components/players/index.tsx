/**
 * players/index.tsx — Dynamic Video Player Router
 *
 * Routes to the correct player based on detected provider.
 *
 * ── Adding a new EMBED-ONLY provider (Wistia, Kaltura, Dailymotion, etc.) ──
 *    1. Add provider object to videoProviders.ts   ← THAT IS ALL
 *       The router automatically falls through to GenericEmbedPlayer.
 *
 * ── Adding a new INTERACTIVE provider (needs postMessage / custom controls) ──
 *    1. Add provider object to videoProviders.ts
 *    2. Create YourPlayer.tsx in this folder
 *    3. Add `case "yourname": return <YourPlayer {...props} />` below
 *
 * Built-in providers:
 *   youtube    → YTPlayer         (custom controls, full postMessage API)
 *   vimeo      → VimeoPlayer      (custom controls, Vimeo postMessage API)
 *   bunny      → BunnyPlayer      (native iframe, session-timer progress)
 *   cloudflare → CloudflarePlayer (native iframe, session-timer progress)
 *   native     → NativePlayer     (HTML5 <video>, exact progress events)
 *   [anything] → GenericEmbedPlayer (iframe embed, session-timer progress)
 */
import React from "react"
import { detectProvider } from "@/lib/videoProviders"
import type { PlayerProps } from "./shared"
import YTPlayer          from "./YTPlayer"
import VimeoPlayer       from "./VimeoPlayer"
import BunnyPlayer       from "./BunnyPlayer"
import CloudflarePlayer  from "./CloudflarePlayer"
import NativePlayer      from "./NativePlayer"
import GenericEmbedPlayer from "./GenericEmbedPlayer"

export default function VideoPlayer(props: PlayerProps) {
  const provider = detectProvider(props.videoUrl)

  // ── Named providers with dedicated players ────────────────────────────────
  switch (provider.name) {
    case "youtube":    return <YTPlayer         {...props} />
    case "vimeo":      return <VimeoPlayer      {...props} />
    case "bunny":      return <BunnyPlayer      {...props} />
    case "cloudflare": return <CloudflarePlayer {...props} />
    case "native":     return <NativePlayer     {...props} />
  }

  // ── Unknown / custom providers → automatic iframe embed fallback ───────────
  // No new player file needed. Just add the provider to videoProviders.ts.
  return (
    <GenericEmbedPlayer
      {...props}
      providerLabel={provider.label}
      embedUrl={provider.getEmbedUrl(props.videoUrl, props.initialSeekSeconds ?? 0)}
    />
  )
}

export type { PlayerProps }
