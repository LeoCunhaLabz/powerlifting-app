import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { captureHandoffFromUrl } from './utils/strengthHandoff'

// Handoff da calculadora de força da landing (#318): lê /registro#forca= antes de
// qualquer tela e limpa a URL.
const { openRegister } = captureHandoffFromUrl(window.location)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App openRegister={openRegister} />
  </StrictMode>,
)
