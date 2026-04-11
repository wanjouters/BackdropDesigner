import { useState } from 'react'
import { supabase } from '../utils/supabase'

export default function AdminLogin() {
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
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href,
    })
    setLoading(false)
    setResetSent(true)
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
          <span className="font-semibold text-gray-900">BackdropDesigner Admin</span>
        </div>

        {resetSent ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-gray-900 mb-1">E-mail verstuurd</p>
            <p className="text-sm text-gray-500">
              Check je inbox voor <strong>{email}</strong> en klik op de link om een nieuw wachtwoord in te stellen.
            </p>
            <button onClick={() => setResetSent(false)}
              className="mt-4 text-xs text-gray-400 hover:text-gray-600">
              Terug naar inloggen
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">E-mailadres</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jan@flanderscla ssics.be"
                required
                autoComplete="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Wachtwoord</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              {loading ? 'Inloggen…' : 'Inloggen'}
            </button>

            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors text-center"
            >
              Wachtwoord vergeten?
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
