import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { DirectionProvider } from '@/components/layout/DirectionProvider'
import { ToastContainer } from '@/components/feedback/ToastContainer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <DirectionProvider>
        <App />
        <ToastContainer />
      </DirectionProvider>
    </ThemeProvider>
  </StrictMode>,
)
