import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'

const EDGE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/admin-users'

async function callEdge(action, payload = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + session.access_token,
    },
    body: JSON.stringify({ action, ...payload }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('nl-BE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function GebruikersSection({ showToast }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  async function loadUsers() {
    try {
      const data = await callEdge('list')
      const list = data?.users ?? data ?? []
      const sorted = Array.isArray(list)
        ? list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        : []
      setUsers(sorted)
    } catch (e) {
      showToast('Laden mislukt: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUsers() }, [])

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      await callEdge('invite', { email: inviteEmail.trim() })
      showToast('Uitnodiging verstuurd naar ' + inviteEmail.trim())
      setInviteEmail('')
      loadUsers()
    } catch (e) {
      showToast('Uitnodigen mislukt: ' + e.message, 'error')
    } finally {
      setInviting(false)
    }
  }

  async function handleDelete(user) {
    try {
      await callEdge('delete', { userId: user.id })
      showToast(user.email + ' verwijderd')
      setDeleteConfirm(null)
      setUsers(prev => prev.filter(u => u.id !== user.id))
    } catch (e) {
      showToast('Verwijderen mislukt: ' + e.message, 'error')
    }
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Laden…</div>

  return (
    <div className="p-8 max-w-2xl">

      {/* Uitnodigen */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-800 mb-1">Gebruiker uitnodigen</h2>
        <p className="text-xs text-gray-400 mb-4">
          De gebruiker ontvangt een e-mail met een inloglink. Ze kunnen daarna inloggen via de app.
        </p>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="naam@flanderscla ssics.be"
            required
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 whitespace-nowrap"
          >
            {inviting ? 'Versturen…' : 'Uitnodigen'}
          </button>
        </form>
      </div>

      {/* Gebruikerslijst */}
      <h2 className="text-sm font-semibold text-gray-800 mb-3">
        Gebruikers ({users.length})
      </h2>

      <div className="space-y-2">
        {users.map(user => (
          <div key={user.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center shrink-0">
              {user.email[0].toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user.email}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                  user.confirmed_at
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {user.confirmed_at ? 'Bevestigd' : 'Uitgenodigd'}
                </span>
                <span className="text-xs text-gray-400">
                  Lid sinds {formatDate(user.created_at).split(' om')[0]}
                </span>
                {user.last_sign_in_at && (
                  <span className="text-xs text-gray-400">
                    Laatste login {formatDate(user.last_sign_in_at)}
                  </span>
                )}
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={() => setDeleteConfirm(user)}
              className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
              title="Verwijderen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}

        {users.length === 0 && (
          <p className="text-sm text-gray-400 italic">Geen gebruikers gevonden.</p>
        )}
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Gebruiker verwijderen?</h3>
            <p className="text-sm text-gray-500 mb-6">
              <strong>{deleteConfirm.email}</strong> wordt permanent verwijderd en kan niet meer inloggen.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Annuleren
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
