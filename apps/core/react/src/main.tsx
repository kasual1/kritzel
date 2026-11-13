import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { UpdrawPath, UpdrawImage, UpdrawText, UpdrawLine, UpdrawShape, UpdrawGroup, UpdrawDynamicObject, UpdrawIframeObject, ShapeType } from '@updraw/react-editor'

// Expose Updraw classes on window for Playwright e2e tests
(window as any).__updraw__ = { UpdrawPath, UpdrawImage, UpdrawText, UpdrawLine, UpdrawShape, UpdrawGroup, UpdrawDynamicObject, UpdrawIframeObject, ShapeType };

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
