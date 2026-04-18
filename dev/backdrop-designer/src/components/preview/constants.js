// Zoom + ruler + overlay dimensions for PreviewCanvas

export const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4]
export const RULER_SIZE = 20  // px — thickness of both rulers

export function getTickSpacing(scale) {
  const nice = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000]
  return nice.find(n => n * scale >= 55) || 5000
}

export const PERSON_H_MM = 1800
export const PERSON_W_MM = 583
export const PERSON_VB_W = 1653.519
export const PERSON_VB_H = 5102.362

export const CHAIR_H_MM = 1327
export const CHAIR_W_MM = 691
export const CHAIR_VB_W = 1959.463
export const CHAIR_VB_H = 3761.352
