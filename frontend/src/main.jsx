import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import BackendCheck from './components/common/BackendCheck'
import './index.css'

// A deployment can replace an old hashed lazy chunk while a browser tab still
// holds the previous HTML. Recover once from Vite's preload error, then allow
// the next page load to use the current deployment's HTML and asset manifest.
const CHUNK_RELOAD_KEY = 'learnAfrica:chunk-reload-once'
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY)
        return
      }
      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
      event.preventDefault()
      window.location.reload()
    } catch {
      // If storage is unavailable, leave Vite's normal error handling intact.
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <BackendCheck />
  </React.StrictMode>
)
