import { foldAccents } from './validation'

export interface TextSegment {
  text: string
  highlighted: boolean
}

export function getSegments(text: string, indices: ReadonlyArray<[number, number]>): TextSegment[] {
  if (!indices.length) return [{ text, highlighted: false }]
  const segments: TextSegment[] = []
  let last = 0
  for (const [start, end] of indices) {
    if (start > last) segments.push({ text: text.slice(last, start), highlighted: false })
    segments.push({ text: text.slice(start, end + 1), highlighted: true })
    last = end + 1
  }
  if (last < text.length) segments.push({ text: text.slice(last), highlighted: false })
  return segments
}

export function getSegmentsFromQuery(text: string, query: string): TextSegment[] {
  const trimmed = query.trim()
  if (!trimmed) return [{ text, highlighted: false }]
  const folded = foldAccents(text)
  const foldedQuery = foldAccents(trimmed)
  const segments: TextSegment[] = []
  let last = 0
  let idx = folded.indexOf(foldedQuery)
  while (idx !== -1) {
    if (idx > last) segments.push({ text: text.slice(last, idx), highlighted: false })
    segments.push({ text: text.slice(idx, idx + foldedQuery.length), highlighted: true })
    last = idx + foldedQuery.length
    idx = folded.indexOf(foldedQuery, last)
  }
  if (last < text.length) segments.push({ text: text.slice(last), highlighted: false })
  return segments
}
