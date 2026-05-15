import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers'
import { loadChunks, saveChunks, type RAGChunk } from '../stores/knowledgeStore'

let embedder: FeatureExtractionPipeline | null = null
let embedderPromise: Promise<FeatureExtractionPipeline> | null = null

export async function getEmbedder(): Promise<FeatureExtractionPipeline> {
  if (embedder) return embedder
  if (embedderPromise) return embedderPromise

  embedderPromise = pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2',
    { quantized: false }
  )

  embedder = await embedderPromise
  return embedder
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await getEmbedder()
  const output = await extractor(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data as Float32Array)
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function splitIntoChunks(text: string, minLength = 50): string[] {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 0)
  const chunks: string[] = []
  let current = ''

  for (const para of paragraphs) {
    if (current.length === 0) {
      current = para
    } else {
      current += '\n\n' + para
    }

    if (current.length >= minLength) {
      chunks.push(current)
      current = ''
    }
  }

  if (current.length > 0) {
    if (chunks.length > 0 && current.length < minLength) {
      chunks[chunks.length - 1] += '\n\n' + current
    } else {
      chunks.push(current)
    }
  }

  return chunks
}

export async function indexDocument(
  spaceId: string,
  docId: string,
  content: string,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const chunks = splitIntoChunks(content)
  const existing = loadChunks(spaceId)
  const filtered = existing.filter((c) => c.docId !== docId)

  const newChunks: RAGChunk[] = []
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i])
    newChunks.push({
      id: `${docId}-chunk-${i}`,
      docId,
      content: chunks[i],
      embedding
    })
    onProgress?.(i + 1, chunks.length)
  }

  saveChunks(spaceId, [...filtered, ...newChunks])
}

export function removeDocumentIndex(spaceId: string, docId: string): void {
  const existing = loadChunks(spaceId)
  saveChunks(spaceId, existing.filter((c) => c.docId !== docId))
}

export async function retrieveRelevantChunks(
  spaceId: string,
  query: string,
  topK = 3,
  threshold = 0.3
): Promise<{ content: string; score: number }[]> {
  const chunks = loadChunks(spaceId)
  if (chunks.length === 0) return []

  const queryEmbedding = await generateEmbedding(query)

  const scored = chunks.map((chunk) => ({
    content: chunk.content,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }))

  scored.sort((a, b) => b.score - a.score)

  return scored
    .filter((s) => s.score >= threshold)
    .slice(0, topK)
}

export async function buildRAGSystemPrompt(
  spaceId: string,
  query: string
): Promise<string | null> {
  const chunks = await retrieveRelevantChunks(spaceId, query)
  if (chunks.length === 0) return null

  const refs = chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n')
  return `以下是与用户问题相关的参考资料：\n\n${refs}\n\n请基于以上资料回答问题。如果资料中没有相关信息，请明确说明。`
}
