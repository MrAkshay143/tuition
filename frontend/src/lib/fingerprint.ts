// Generates persistent device UUID and browser fingerprint hash


export interface BrowserFingerprint {
  deviceId: string
  fingerprintHash: string
  timezone: string
  language: string
  appVersion: string
}

export async function getClientFingerprint(): Promise<BrowserFingerprint> {
  let deviceId = localStorage.getItem('eduflow_device_id')
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem('eduflow_device_id', deviceId)
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const language = navigator.language || 'en'
  const appVersion = '1.0.0'

  const components = [
    navigator.userAgent,
    navigator.platform,
    timezone,
    language,
    `${window.screen.width}x${window.screen.height}`,
    window.screen.colorDepth,
    navigator.hardwareConcurrency || 4,
    'ontouchstart' in window ? 'touch' : 'no-touch',
  ]

  const rawString = components.join('|')
  const encoder = new TextEncoder()
  const data = encoder.encode(rawString)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const fingerprintHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return {
    deviceId,
    fingerprintHash,
    timezone,
    language,
    appVersion,
  }
}
