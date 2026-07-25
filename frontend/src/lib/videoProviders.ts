/**
 * videoProviders.ts
 * Provider registry for all supported video platforms.
 * Add new providers here — no other file needs to change.
 *
 * Supported: YouTube, Vimeo, Bunny Stream, Cloudflare Stream, Native (MP4/HLS)
 */

/**
 * Built-in provider names. Custom providers can use any string value —
 * they will automatically fall through to GenericEmbedPlayer in the router.
 */
export type ProviderName = "youtube" | "vimeo" | "bunny" | "cloudflare" | "native" | (string & {})


export interface VideoProvider {
  name: ProviderName
  label: string
  /** Return true if this provider handles the given URL. */
  isMatch(url: string): boolean
  /** Extract the provider-native video ID from a URL. */
  extractId(url: string): string | null
  /** Build the iframe embed URL with optional autoplay+seek. */
  getEmbedUrl(url: string, startSeconds?: number): string
  /** True when the player supports two-way postMessage communication. */
  supportsPostMessage: boolean
}

// ── YouTube ──────────────────────────────────────────────────────────────────
const youtubeProvider: VideoProvider = {
  name: "youtube",
  label: "YouTube",
  supportsPostMessage: true,
  isMatch: (url) => /youtu\.be|youtube\.com/.test(url) ||
    (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())),
  extractId: (url) => {
    const s = url.trim()
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s
    const m = s.match(/(?:youtu\.be\/|v\/|watch\?v=|embed\/|u\/\w\/)([a-zA-Z0-9_-]{11})/)
    return m?.[1] ?? null
  },
  getEmbedUrl: (url, startSeconds = 0) => {
    const id = youtubeProvider.extractId(url)
    if (!id) return url
    const t = Math.max(0, Math.floor(startSeconds ?? 0))
    return `https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3${t > 0 ? `&start=${t}` : ""}`
  },
}

// ── Vimeo ─────────────────────────────────────────────────────────────────────
const vimeoProvider: VideoProvider = {
  name: "vimeo",
  label: "Vimeo",
  supportsPostMessage: true,
  isMatch: (url) => /vimeo\.com/.test(url),
  extractId: (url) => {
    const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    return m?.[1] ?? null
  },
  getEmbedUrl: (url, startSeconds = 0) => {
    const id = vimeoProvider.extractId(url)
    if (!id) return url
    const t = Math.max(0, Math.floor(startSeconds ?? 0))
    return `https://player.vimeo.com/video/${id}?api=1&autoplay=1&title=0&byline=0&portrait=0${t > 0 ? `#t=${t}s` : ""}`
  },
}

// ── Bunny Stream ──────────────────────────────────────────────────────────────
const bunnyProvider: VideoProvider = {
  name: "bunny",
  label: "Bunny Stream",
  supportsPostMessage: false,
  isMatch: (url) => /mediadelivery\.net|bunny\.net/.test(url),
  extractId: (url) => {
    const m = url.match(/embed\/[\w-]+\/([\w-]+)/)
    return m?.[1] ?? null
  },
  getEmbedUrl: (url, startSeconds = 0) => {
    const t = Math.max(0, Math.floor(startSeconds ?? 0))
    // If already an embed URL, append params
    if (url.includes("iframe.mediadelivery.net") || url.includes("iframe.bunny.net")) {
      const sep = url.includes("?") ? "&" : "?"
      return `${url}${sep}autoplay=true&responsive=true${t > 0 ? `&t=${t}` : ""}`
    }
    // Try to reconstruct embed URL
    const m = url.match(/(?:mediadelivery\.net|bunny\.net)\/(?:play|embed)?\/?(?:[\w-]+\/)?([a-f0-9-]{36})\/([\w-]+)/)
    if (m) return `https://iframe.mediadelivery.net/embed/${m[1]}/${m[2]}?autoplay=true${t > 0 ? `&t=${t}` : ""}`
    return url
  },
}

// ── Cloudflare Stream ─────────────────────────────────────────────────────────
const cloudflareProvider: VideoProvider = {
  name: "cloudflare",
  label: "Cloudflare Stream",
  supportsPostMessage: false,
  isMatch: (url) => /cloudflarestream\.com|stream\.cloudflare\.com/.test(url),
  extractId: (url) => {
    const m = url.match(/(?:cloudflarestream\.com|stream\.cloudflare\.com)\/([a-f0-9]+)/)
    return m?.[1] ?? null
  },
  getEmbedUrl: (url, startSeconds = 0) => {
    const t = Math.max(0, Math.floor(startSeconds ?? 0))
    const id = cloudflareProvider.extractId(url)
    if (id) return `https://iframe.cloudflarestream.com/${id}?autoplay=true${t > 0 ? `&startTime=${t}` : ""}`
    if (url.includes("iframe.cloudflarestream.com")) {
      const sep = url.includes("?") ? "&" : "?"
      return `${url}${sep}autoplay=true${t > 0 ? `&startTime=${t}` : ""}`
    }
    return url
  },
}

// ── Native (MP4, HLS, WebM, local streams) ───────────────────────────────────
const nativeProvider: VideoProvider = {
  name: "native",
  label: "Native Video",
  supportsPostMessage: false,
  isMatch: (_url) => true, // fallback — matches everything not caught above
  extractId: (_url) => null,
  getEmbedUrl: (url) => url,
}

// ── Registry ──────────────────────────────────────────────────────────────────

/**
 * Ordered list of all supported providers.
 * To add a new provider, implement VideoProvider and prepend it to this list.
 */
export const VIDEO_PROVIDERS: VideoProvider[] = [
  youtubeProvider,
  vimeoProvider,
  bunnyProvider,
  cloudflareProvider,
  nativeProvider, // must be last (catches all)
]

/** Detect which provider handles the given URL. Never returns null. */
export function detectProvider(url: string): VideoProvider {
  if (!url) return nativeProvider
  return VIDEO_PROVIDERS.find((p) => p.isMatch(url)) ?? nativeProvider
}
