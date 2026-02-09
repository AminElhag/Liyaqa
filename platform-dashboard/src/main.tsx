import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { DirectionProvider } from '@/components/layout/DirectionProvider'
import { ToastContainer } from '@/components/feedback/ToastContainer'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { OfflineBanner } from '@/components/feedback/OfflineBanner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <DirectionProvider>
          <App />
          <ToastContainer />
          <OfflineBanner />
        </DirectionProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
