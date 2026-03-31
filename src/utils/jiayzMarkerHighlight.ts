/**
 * 为单个打点时刻匹配句子下标（与 sentenceIndicesNearMarkerMs 规则一致）。
 */
function indexForMarker(
  sentences: Array<{ startMs?: number; endMs?: number }>,
  m: number
): number {
  const n = sentences.length
  if (!n) return 0

  for (let i = 0; i < n; i++) {
    const s = sentences[i]
    const start = s.startMs ?? 0
    const end =
      s.endMs ??
      (i + 1 < n ? (sentences[i + 1].startMs ?? start) : Number.POSITIVE_INFINITY)
    const lo = Math.min(start, end)
    const hi = Math.max(start, end)
    if (m >= lo && m <= hi) return i
  }

  let bestIdx = 0
  let minD = Number.POSITIVE_INFINITY
  for (let i = 0; i < n; i++) {
    const s = sentences[i]
    const start = s.startMs ?? 0
    const end =
      s.endMs ?? (i + 1 < n ? (sentences[i + 1].startMs ?? start) : start)
    const lo = Math.min(start, end)
    const hi = Math.max(start, end)
    let d: number
    if (m < lo) d = lo - m
    else if (m > hi) d = m - hi
    else d = 0
    if (d < minD) {
      minD = d
      bestIdx = i
    }
  }
  return bestIdx
}

/**
 * 根据进度条打点时刻（ms），匹配应对应高亮的句子下标（与列表顺序一致）。
 */
export function sentenceIndicesNearMarkerMs(
  sentences: Array<{ startMs?: number; endMs?: number }>,
  markersMs: number[]
): Set<number> {
  const set = new Set<number>()
  if (!markersMs.length || !sentences.length) return set
  for (const m of markersMs) {
    if (m < 0) continue
    set.add(indexForMarker(sentences, m))
  }
  return set
}

function mergeSpans(spans: { start: number; end: number }[]): { start: number; end: number }[] {
  if (!spans.length) return []
  const s = [...spans].sort((a, b) => a.start - b.start)
  const out: { start: number; end: number }[] = [{ ...s[0] }]
  for (let i = 1; i < s.length; i++) {
    const last = out[out.length - 1]
    if (s[i].start <= last.end) last.end = Math.max(last.end, s[i].end)
    else out.push({ ...s[i] })
  }
  return out
}

function buildSegmentsFromSpans(
  text: string,
  spans: { start: number; end: number }[]
): { text: string; highlight: boolean }[] {
  if (!text) return []
  if (!spans.length) return [{ text, highlight: false }]
  const merged = mergeSpans(spans)
  const out: { text: string; highlight: boolean }[] = []
  let pos = 0
  for (const sp of merged) {
    if (sp.start > pos) out.push({ text: text.slice(pos, sp.start), highlight: false })
    out.push({ text: text.slice(sp.start, sp.end), highlight: true })
    pos = sp.end
  }
  if (pos < text.length) out.push({ text: text.slice(pos), highlight: false })
  return out
}

/**
 * 在句内按时间比例将打点映射到字符区间（无字级时间戳时的近似）。
 */
function charSpanForMarkerInSentence(
  text: string,
  sentences: Array<{ startMs?: number; endMs?: number }>,
  sentenceIndex: number,
  markerMs: number
): { start: number; end: number } | null {
  const len = text.length
  if (!len) return null

  const i = sentenceIndex
  const s = sentences[i]
  const start = s.startMs ?? 0
  const end =
    s.endMs ??
    (i + 1 < sentences.length ? (sentences[i + 1].startMs ?? start) : start)
  const lo = Math.min(start, end)
  const hi = Math.max(start, end)
  const dur = Math.max(1, hi - lo)

  let t: number
  if (markerMs <= lo) t = 0
  else if (markerMs >= hi) t = 1
  else t = (markerMs - lo) / dur

  const center = Math.floor(t * len)
  const span = Math.max(6, Math.min(48, Math.floor(len * 0.15)))
  let from = Math.max(0, center - Math.floor(span / 2))
  let to = Math.min(len, from + span)
  if (to - from < 4) to = Math.min(len, from + 4)
  return { start: from, end: to }
}

/**
 * 句子正文按标记拆成普通片段 + 高亮片段（仅 .jyz 有 markers 时才有高亮）。
 */
export function sentenceTextSegmentsForJiayzMarkers(
  sentence: { text?: string; startMs?: number; endMs?: number },
  sentenceIndex: number,
  sentences: Array<{ startMs?: number; endMs?: number }>,
  markersMs: number[]
): { text: string; highlight: boolean }[] {
  const text = sentence.text ?? ''
  if (!markersMs.length || !text) return [{ text, highlight: false }]

  const markersForSentence: number[] = []
  for (const m of markersMs) {
    if (m < 0) continue
    if (indexForMarker(sentences, m) === sentenceIndex) markersForSentence.push(m)
  }
  if (!markersForSentence.length) return [{ text, highlight: false }]

  const spans: { start: number; end: number }[] = []
  for (const m of markersForSentence) {
    const sp = charSpanForMarkerInSentence(text, sentences, sentenceIndex, m)
    if (sp) spans.push(sp)
  }
  return buildSegmentsFromSpans(text, spans)
}
