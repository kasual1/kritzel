import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { KritzelPath, KritzelImage, KritzelText, KritzelLine, KritzelShape, KritzelGroup, KritzelDynamicObject, ShapeType } from '@kritzel/react-editor'

// Expose Kritzel classes on window for Playwright e2e tests
(window as any).__kritzel__ = { KritzelPath, KritzelImage, KritzelText, KritzelLine, KritzelShape, KritzelGroup, KritzelDynamicObject, ShapeType };

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
