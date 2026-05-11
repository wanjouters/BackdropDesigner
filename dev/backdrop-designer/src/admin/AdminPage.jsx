import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import AdminLogin from './AdminLogin'
import AdminLayout from './AdminLayout'

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
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm">
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
            <p className="text-sm text-gray-500 mb-4">Je bent nu ingelogd en kan de instellingen gebruiken.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nieuw wachtwoord</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minstens 8 tekens"
                required
                autoComplete="new-password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Bevestig wachtwoord</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Herhaal wachtwoord"
                required
                autoComplete="new-password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              {loading ? 'Opslaan…' : 'Wachtwoord instellen'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function UserProfilePage({ session }) {
  const [name, setName] = useState(session.user.user_metadata?.name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function handleSaveName(e) {
    e.preventDefault()
    setSavingName(true)
    setError(null)
    setSuccess(null)
    const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } })
    setSavingName(false)
    if (error) { setError(error.message); return }
    setSuccess('Naam opgeslagen')
  }

  async function handleSavePassword(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Wachtwoorden komen niet overeen.'); return }
    if (password.length < 8) { setError('Wachtwoord moet minstens 8 tekens lang zijn.'); return }
    setSavingPw(true)
    setError(null)
    setSuccess(null)
    const { error } = await supabase.auth.updateUser({ password })
    setSavingPw(false)
    if (error) { setError(error.message); return }
    setSuccess('Wachtwoord gewijzigd')
    setPassword('')
    setConfirm('')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-gray-900 text-sm">Mijn profiel</span>
        <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← Terug naar de app</a>
      </div>
      <div className="flex-1 p-8 max-w-md mx-auto w-full space-y-4">

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Naam</h2>
          <form onSubmit={handleSaveName} className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Voor- en achternaam"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button type="submit" disabled={savingName}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
              {savingName ? 'Opslaan…' : 'Opslaan'}
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Wachtwoord wijzigen</h2>
          <form onSubmit={handleSavePassword} className="space-y-3">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Nieuw wachtwoord (min. 8 tekens)" required autoComplete="new-password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Bevestig wachtwoord" required autoComplete="new-password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
            <button type="submit" disabled={savingPw || !password || !confirm}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
              {savingPw ? 'Opslaan…' : 'Wachtwoord wijzigen'}
            </button>
          </form>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        {success && <p className="text-xs text-green-600">{success}</p>}

        <button
          onClick={() => supabase.auth.signOut().then(() => { window.location.href = '/' })}
          className="w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Uitloggen
        </button>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  // Check URL immediately (PKCE: query params; implicit: hash)
  const [isRecovery, setIsRecovery] = useState(() => {
    const search = new URLSearchParams(window.location.search)
    return search.get('type') === 'recovery' ||
           window.location.hash.includes('type=recovery')
  })

  useEffect(() => {
    // onAuthStateChange handles ALL auth events incl. PASSWORD_RECOVERY after PKCE exchange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
      if (event === 'USER_UPDATED') setIsRecovery(false)
      setSession(session)
      setLoading(false)
    })
    // Fallback: als onAuthStateChange niet vuurt (statische sessie zonder auth-actie)
    const fallback = setTimeout(() => setLoading(false), 3000)
    return () => { subscription.unsubscribe(); clearTimeout(fallback) }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-400 text-sm">
        Laden…
      </div>
    )
  }

  // Recovery check VÓÓR session check — recovery heeft een sessie maar wil geen admin tonen
  if (isRecovery) return <PasswordResetForm />
  if (!session) return <AdminLogin />
  if (session.user.app_metadata?.role !== 'admin') return <UserProfilePage session={session} />
  return <AdminLayout session={session} />
}
