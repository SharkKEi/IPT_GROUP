import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
<<<<<<< HEAD
=======
import ErrorBoundary from './components/ErrorBoundary.jsx'
>>>>>>> 56b74d6 (Updated project code)
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
<<<<<<< HEAD
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading…</div>}>
          <App />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
=======
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading…</div>}>
            <App />
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
>>>>>>> 56b74d6 (Updated project code)
  </React.StrictMode>,
)
