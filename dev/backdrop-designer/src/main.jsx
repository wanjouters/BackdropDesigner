import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import AppPage from './AppPage.jsx'

// Admin is lazy-geladen zodat het niet in de main bundle zit
const AdminPage = lazy(() => import('./admin/AdminPage.jsx'))

function AdminFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">
      Instellingen laden…
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppPage />} />
        <Route
          path="/instellingen"
          element={
            <Suspense fallback={<AdminFallback />}>
              <AdminPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
