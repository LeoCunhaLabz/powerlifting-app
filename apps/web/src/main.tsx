import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { captureHandoffFromUrl } from './utils/strengthHandoff'

const root = createRoot(document.getElementById('root')!)

// Catálogo de componentes (/catalogo): só no npm run dev. O Vite troca
// import.meta.env.DEV por false no build e o import some do bundle.
if (import.meta.env.DEV && window.location.pathname === '/catalogo') {
  void import('./dev/Catalogo').then(({ default: Catalogo }) => {
    root.render(
      <StrictMode>
        <Catalogo />
      </StrictMode>,
    )
  })
} else {
  // Handoff da calculadora de força da landing (#318): lê /registro#forca= antes de
  // qualquer tela e limpa a URL.
  const { openRegister } = captureHandoffFromUrl(window.location)

  root.render(
    <StrictMode>
      <App openRegister={openRegister} />
    </StrictMode>,
  )
}
