import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { slideFromRightVariants } from '../../utils/animations'

export default function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  const styles = {
    success: { bg: '#16a34a', icon: <path d="M2 7l4 4 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> },
    info:    { bg: '#2563eb', icon: <path d="M7 3v4M7 9v1" stroke="white" strokeWidth="2" strokeLinecap="round"/> },
    warning: { bg: '#d97706', icon: <path d="M7 3v4M7 9v1" stroke="white" strokeWidth="2" strokeLinecap="round"/> },
    error:   { bg: '#dc2626', icon: <path d="M3 3l8 8M11 3L3 11" stroke="white" strokeWidth="2" strokeLinecap="round"/> },
  }
  const s = styles[type] || styles.success

  return (
    <motion.div
      variants={slideFromRightVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{
        position: 'fixed', bottom: 28, right: 28, zIndex: 400,
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px', borderRadius: 10,
        background: s.bg,
        color: 'white', fontSize: 13, fontWeight: 600,
        boxShadow: '0 4px 24px rgba(0,0,0,0.22)',
        pointerEvents: 'none',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">{s.icon}</svg>
      {message}
    </motion.div>
  )
}
