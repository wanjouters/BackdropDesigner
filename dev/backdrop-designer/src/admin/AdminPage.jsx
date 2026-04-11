import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import AdminLogin from './AdminLogin'
import AdminLayout from './AdminLayout'

export default function AdminPage() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-400 text-sm">
        Laden…
      </div>
    )
  }

  if (!session) return <AdminLogin />
  return <AdminLayout session={session} />
}
