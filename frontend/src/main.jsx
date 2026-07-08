import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

// In dev mode React prints a "Download the React DevTools" tip when the browser
// extension isn't installed. It's harmless noise logged asynchronously, so we
// intercept console.log and hide only that single line. Everything else is left
// untouched. (For full inspection power, install the React DevTools extension.)
if (import.meta.env.DEV) {
  const DEVTOOLS_HINT = 'Download the React DevTools'
  const originalLog = console.log
  console.log = function (...args) {
    const isDevtoolsHint =
      typeof args[0] === 'string' && args[0].includes(DEVTOOLS_HINT) ||
      (args.length > 1 && typeof args[1] === 'string' && args[1].includes(DEVTOOLS_HINT))
    if (isDevtoolsHint) return
    return originalLog.apply(console, args)
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
