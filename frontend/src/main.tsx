import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

import { ThemeProvider } from '@/design-system/providers/ThemeProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 min
      gcTime:    1000 * 60 * 10,  // 10 min
      retry:     1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
