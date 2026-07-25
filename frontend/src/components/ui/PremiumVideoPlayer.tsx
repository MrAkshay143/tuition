/**
 * PremiumVideoPlayer.tsx
 * Backward-compatible re-export of the dynamic VideoPlayer router.
 * All new code should import from "@/components/players" directly.
 */
export { default } from "@/components/players"

// extractYoutubeId helper — derive from the provider registry
import { VIDEO_PROVIDERS } from "@/lib/videoProviders"
const _ytProvider = VIDEO_PROVIDERS.find((p) => p.name === "youtube")!
export const extractYoutubeId = (url: string): string | null => _ytProvider.extractId(url)
