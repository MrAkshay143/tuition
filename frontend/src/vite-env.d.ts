/// <reference types="vite/client" />
/// <reference types="react" />

// Allow CSS imports
declare module '*.css' {
  const src: string
  export default src
}
// Allow SVG imports
declare module '*.svg' {
  import React from 'react'
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
  const src: string
  export default src
}
// Allow image imports
declare module '*.png' { const src: string; export default src }
declare module '*.jpg' { const src: string; export default src }
declare module '*.webp' { const src: string; export default src }
