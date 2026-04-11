import { useState } from 'react'
import { supabase } from '../utils/supabase'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
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

        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-gray-900 mb-1">Check je e-mail</p>
            <p className="text-sm text-gray-500">
              We hebben een inloglink gestuurd naar <strong>{email}</strong>.
              Klik op de link in de e-mail om in te loggen.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block text-xs font-medium text-gray-500 mb-1">E-mailadres</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jan@flanderscla ssics.be"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:border-blue-500"
            />
            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              {loading ? 'Versturen…' : 'Stuur inloglink'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
