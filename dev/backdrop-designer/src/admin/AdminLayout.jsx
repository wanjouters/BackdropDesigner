import { useState, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import LogosSection from './sections/LogosSection'
import EventsSection from './sections/EventsSection'
import CategorieenSection from './sections/CategorieenSection'
import PresetsSection from './sections/PresetsSection'

const NAV = [
  {
    id: 'logos',
    label: "Logo's",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'events',
    label: 'Events & Koepels',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'categorieen',
    label: 'Categorieën',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    id: 'presets',
    label: 'Presets',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
]

export default function AdminLayout({ session }) {
  const [active, setActive] = useState('logos')
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const sectionProps = { showToast }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Sidebar */}
      <div className="flex flex-col bg-gray-900 shrink-0" style={{ width: 220 }}>
        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-700">
          <p className="text-white font-semibold text-sm">BackdropDesigner</p>
          <p className="text-gray-400 text-xs mt-0.5">Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                active === item.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700">
          <div className="text-gray-500 text-xs px-2 mb-2 truncate">{session.user.email}</div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Uitloggen
          </button>
          <a
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-white/5 transition-colors mt-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Terug naar app
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 shrink-0">
          <h1 className="text-base font-semibold text-gray-900">
            {NAV.find(n => n.id === active)?.label}
          </h1>
        </div>

        {/* Section */}
        <div className="flex-1 overflow-y-auto">
          {active === 'logos' && <LogosSection {...sectionProps} />}
          {active === 'events' && <EventsSection {...sectionProps} />}
          {active === 'categorieen' && <CategorieenSection {...sectionProps} />}
          {active === 'presets' && <PresetsSection {...sectionProps} />}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white z-50 transition-all ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
