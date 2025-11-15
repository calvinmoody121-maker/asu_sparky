import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FaceFilter from './asu-sparky-face-filter'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FaceFilter />
  </StrictMode>,
)
