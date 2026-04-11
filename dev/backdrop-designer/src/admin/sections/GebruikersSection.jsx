import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'

const EDGE_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/admin-users'

const ROLES = [
  { value: 'admin', label: 'Admin', color: 'bg-purple-50 text-purple-700' },
  { value: 'gebruiker', label: 'Gebruiker', color: 'bg-blue-50 text-blue-700' },
]

function getRoleStyle(role) {
  return ROLES.find(r => r.value === role)?.color ?? 'bg-gray-50 text-gray-500'
}
function getRoleLabel(role) {
  return ROLES.find(r => r.value === role)?.label ?? role
}

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
  if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('nl-BE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function UserRow({ user, onUpdated, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name ?? '')
  const [role, setRole] = useState(user.role ?? 'gebruiker')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await callEdge('update', { userId: user.id, name: name.trim(), role })
      onUpdated({ ...user, name: name.trim(), role })
      setEditing(false)
    } catch (e) {
      alert('Opslaan mislukt: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setName(user.name ?? '')
    setRole(user.role ?? 'gebruiker')
    setEditing(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center shrink-0">
          {(user.name || user.email)[0].toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {user.name
            ? <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
            : <p className="text-sm text-gray-400 italic truncate">Geen naam</p>
          }
          <p className="text-xs text-gray-400 truncate">{user.email}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${getRoleStyle(user.role)}`}>
              {getRoleLabel(user.role)}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
              user.confirmed_at ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {user.confirmed_at ? 'Bevestigd' : 'Uitgenodigd'}
            </span>
            <span className="text-xs text-gray-400">
              Lid sinds {formatDate(user.created_at).split(' om')[0]}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setEditing(e => !e)}
            className={`p-1.5 rounded-lg transition-colors ${
              editing
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Bewerken"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-3 1 1-3a4 4 0 01.828-1.414z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(user)}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg"
            title="Verwijderen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 font-medium mb-1 block">Naam</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Voor- en achternaam"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">Rol</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
            >
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
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

  function handleUpdated(updated) {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
    showToast('Wijzigingen opgeslagen')
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
            placeholder="naam@flandersclassics.be"
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
          <UserRow
            key={user.id}
            user={user}
            onUpdated={handleUpdated}
            onDelete={setDeleteConfirm}
          />
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
              <strong>{deleteConfirm.name || deleteConfirm.email}</strong> wordt permanent verwijderd en kan niet meer inloggen.
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
