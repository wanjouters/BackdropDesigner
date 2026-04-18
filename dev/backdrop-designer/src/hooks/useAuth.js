import { useState, useEffect, useRef } from 'react'
import { supabase } from '../utils/supabase'

/**
 * Handles Supabase auth session state and the outside-click behavior
 * for the account dropdown menu.
 */
export function useAuth(initialSession) {
  const [authSession, setAuthSession] = useState(initialSession ?? null)
  const [authMenuOpen, setAuthMenuOpen] = useState(false)
  const authMenuRef = useRef(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setAuthSession(session))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleOutside(e) {
      if (authMenuRef.current && !authMenuRef.current.contains(e.target)) setAuthMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function signOut() {
    supabase.auth.signOut()
    setAuthMenuOpen(false)
  }

  return { authSession, authMenuOpen, setAuthMenuOpen, authMenuRef, signOut }
}
