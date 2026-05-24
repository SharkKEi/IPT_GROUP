import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
<<<<<<< HEAD
<<<<<<< HEAD
=======
import ErrorBoundary from './components/ErrorBoundary.jsx'
>>>>>>> 56b74d6 (Updated project code)
=======
import ErrorBoundary from './components/ErrorBoundary.jsx'
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
<<<<<<< HEAD
<<<<<<< HEAD
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading…</div>}>
          <App />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
=======
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading…</div>}>
            <App />
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
<<<<<<< HEAD
>>>>>>> 56b74d6 (Updated project code)
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
  </React.StrictMode>,
)
