// Deterministic accent color per series name. Copied verbatim from the design
// handoff README/prototype — used renderer-side for demo-mode data, where
// there's no main-process scan to assign colors.
const COLORS = [
  '#4A9BE8',
  '#E8943A',
  '#48B87A',
  '#5A8FD4',
  '#8B5CF6',
  '#E05C5C',
  '#06B6D4',
  '#D97706',
  '#84CC16',
  '#F43F5E',
  '#A855F7',
  '#14B8A6'
]

export function seriesColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0
  }
  return COLORS[((h % COLORS.length) + COLORS.length) % COLORS.length]
}
