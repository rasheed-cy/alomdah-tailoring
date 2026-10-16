import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster
        position="bottom-left"
        toastOptions={{
          style: {
            fontFamily: 'Dubai, Cairo, Segoe UI, Arial, sans-serif',
            direction: 'rtl',
            background: '#0F172A',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 16px',
          },
        }}
      />
      <App />
    </BrowserRouter>
  </React.StrictMode>
)