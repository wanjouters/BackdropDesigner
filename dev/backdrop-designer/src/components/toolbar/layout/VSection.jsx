import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Vertical layout helpers

export function VSection({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full px-3 py-2 group bg-white"
      >
        <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          className={`text-gray-300 group-hover:text-gray-500 transition-transform ${open ? '' : '-rotate-90'}`}
        >
          <path d="M2 3.5l3 3 3-3"/>
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 px-3 pb-3 pt-1 border-t border-gray-100 bg-white">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function VRow({ children }) {
  return <div className="flex items-end gap-1.5">{children}</div>
}
