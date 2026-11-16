import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UpmadePath, UpmadeImage, UpmadeText, UpmadeLine, UpmadeShape, UpmadeGroup, UpmadeDynamicObject, UpmadeIframeObject, ShapeType } from '@upmade/react-editor'

// Expose Upmade classes on window for Playwright e2e tests
(window as any).__upmade__ = { UpmadePath, UpmadeImage, UpmadeText, UpmadeLine, UpmadeShape, UpmadeGroup, UpmadeDynamicObject, UpmadeIframeObject, ShapeType };

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
