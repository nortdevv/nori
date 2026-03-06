import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Roger from './components/Roger'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Roger></Roger>
  </StrictMode>,
)
