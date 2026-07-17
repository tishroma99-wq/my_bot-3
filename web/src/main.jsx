import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// глобальная защита: если что-то в App упадёт, страница не должна остаться чёрной
window.addEventListener('error', (e) => {
  console.error('Runtime error:', e.error)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
