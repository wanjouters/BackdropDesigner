import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from './utils/supabase'
import App from './App'

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

// ─── Wachtwoord herstellen ───────────────────────────────────────────────────

function PasswordResetForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Wachtwoorden komen niet overeen.'); return }
    if (password.length < 8) { setError('Wachtwoord moet minstens 8 tekens lang zijn.'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-sm border border-gray-100"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900">Nieuw wachtwoord instellen</span>
        </div>

        {done ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-gray-900 mb-1">Wachtwoord ingesteld</p>
            <p className="text-sm text-gray-500">Je kan nu de app gebruiken.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nieuw wachtwoord</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Minstens 8 tekens" required autoComplete="new-password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Bevestig wachtwoord</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Herhaal wachtwoord" required autoComplete="new-password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors" />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button type="submit" disabled={loading || !password || !confirm}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              {loading ? <><Spinner /><span>Opslaan…</span></> : 'Wachtwoord instellen'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

// ─── Login ───────────────────────────────────────────────────────────────────

function AppLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resetSent, setResetSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError('Ongeldig e-mailadres of wachtwoord.')
  }

  async function handleForgotPassword() {
    if (!email) { setError('Vul eerst je e-mailadres in.'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/',
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setResetSent(true)
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-sm border border-gray-100"
      >
        {/* Logo */}
        <div className="mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">BackdropDesigner</h1>
          <p className="text-sm text-gray-400 mt-0.5 font-medium">Flanders Classics</p>
        </div>

        {resetSent ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-medium text-gray-900 mb-1">Controleer je inbox</p>
            <p className="text-sm text-gray-500">We stuurden een link naar <strong>{email}</strong>.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">E-mailadres</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="naam@flandersclassics.be" required autoComplete="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Wachtwoord</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-colors" />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button type="submit" disabled={loading || !email || !password}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-1">
              {loading ? <><Spinner /><span>Inloggen…</span></> : 'Inloggen'}
            </button>
            <button type="button" onClick={handleForgotPassword} disabled={loading}
              className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors pt-1">
              Wachtwoord vergeten?
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

export default function AppPage() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRecovery, setIsRecovery] = useState(() => {
    const search = new URLSearchParams(window.location.search)
    return search.get('type') === 'recovery' || window.location.hash.includes('type=recovery')
  })

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
      if (event === 'USER_UPDATED') setIsRecovery(false)
      setSession(session)
      setLoading(false)
    })
    const fallback = setTimeout(() => setLoading(false), 3000)
    return () => { subscription.unsubscribe(); clearTimeout(fallback) }
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner />
        <p className="text-sm text-gray-400">Laden…</p>
      </div>
    </div>
  )
  if (isRecovery) return <PasswordResetForm />
  if (!session) return <AppLogin />
  return <App session={session} />
}
