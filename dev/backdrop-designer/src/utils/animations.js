export const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
  exit: { opacity: 0, scale: 0.95, y: 8, transition: { duration: 0.15 } },
}

export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

export const slideInVariants = {
  hidden: { x: -16, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: -16, opacity: 0, transition: { duration: 0.12 } },
}

export const slideFromRightVariants = {
  hidden: { x: 48, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: 48, opacity: 0, transition: { duration: 0.15 } },
}

export const listItemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
}

export const listContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}
