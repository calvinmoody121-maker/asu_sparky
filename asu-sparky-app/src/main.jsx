import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FaceFilter from './asu-sparky-face-filter'
import HandDetectionTest from './hand-detection-test'

function AppRouter() {
  const [mode, setMode] = useState('face'); // 'face' or 'hand'

  if (mode === 'hand') {
    return (
      <div key="hand-mode">
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000
        }}>
          <button
            onClick={() => setMode('face')}
            style={{
              background: 'linear-gradient(90deg, #DC143C 0%, #FFC627 100%)',
              color: 'white',
              fontWeight: 'bold',
              padding: '10px 20px',
              borderRadius: '50px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ← Back to Face Filter
          </button>
        </div>
        <HandDetectionTest />
      </div>
    );
  }

  return (
    <div key="face-mode">
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <button
          onClick={() => setMode('hand')}
          style={{
            background: 'linear-gradient(90deg, #FFC627 0%, #FFD700 100%)',
            color: '#8B0000',
            fontWeight: 'bold',
            padding: '10px 20px',
            borderRadius: '50px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Hand Detection Test →
        </button>
      </div>
      <FaceFilter />
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
