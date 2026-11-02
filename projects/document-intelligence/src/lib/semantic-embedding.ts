import "server-only";

import { pipeline } from "@huggingface/transformers";

const MODEL_ID = "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
const MODEL_REVISION = "2c4055b12046f11709e9df2c122e59ffbdc2f900";
const MAX_MODEL_TOKENS = 128;
const WINDOW_TOKENS = 112;
const BATCH_SIZE = 8;

// Change this whenever the model or windowing/pooling contract changes so stored vectors are rebuilt.
export const EMBEDDING_MODEL_VERSION = `${MODEL_ID}@${MODEL_REVISION}:mean:window-${WINDOW_TOKENS}:v1`;

type Extractor = Awaited<ReturnType<typeof pipeline<"feature-extraction">>>;
let extractorPromise: Promise<Extractor> | undefined;

function getExtractor(): Promise<Extractor> {
  extractorPromise ??= pipeline("feature-extraction", MODEL_ID, { revision: MODEL_REVISION }).catch((error: unknown) => {
    extractorPromise = undefined;
    throw error;
  });
  return extractorPromise;
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.hypot(...vector);
  if (!Number.isFinite(magnitude) || magnitude === 0 || vector.some((value) => !Number.isFinite(value))) {
    throw new Error("Embedding model returned an invalid vector");
  }
  return vector.map((value) => value / magnitude);
}

function windows(text: string, extractor: Extractor): string[] {
  const tokenIds = extractor.tokenizer.encode(text, { add_special_tokens: false });
  if (tokenIds.length === 0) return [];

  const result: string[] = [];
  for (let start = 0; start < tokenIds.length;) {
    let end = Math.min(start + WINDOW_TOKENS, tokenIds.length);
    let decoded = extractor.tokenizer.decode(tokenIds.slice(start, end), { skip_special_tokens: true });

    // Decoding and re-encoding can change a few boundary tokens. Keep every input token
    // represented while ensuring the actual model input stays within its 128-token limit.
    while (end > start + 1 && extractor.tokenizer.encode(decoded).length > MAX_MODEL_TOKENS) {
      end -= 1;
      decoded = extractor.tokenizer.decode(tokenIds.slice(start, end), { skip_special_tokens: true });
    }
    if (extractor.tokenizer.encode(decoded).length > MAX_MODEL_TOKENS) {
      throw new Error("Unable to split text within the embedding model token limit");
    }
    result.push(decoded);
    start = end;
  }
  return result;
}

async function embedWindows(texts: string[], extractor: Extractor): Promise<number[][]> {
  const vectors: number[][] = [];
  for (let start = 0; start < texts.length; start += BATCH_SIZE) {
    const batch = texts.slice(start, start + BATCH_SIZE);
    const output = await extractor(batch, { pooling: "mean", normalize: true });
    const rows = output.tolist() as number[][];
    if (rows.length !== batch.length) throw new Error("Embedding model returned an unexpected batch size");
    vectors.push(...rows.map(normalize));
  }
  return vectors;
}

export async function embedPassage(text: string): Promise<number[][]> {
  if (!text.trim()) return [];
  const extractor = await getExtractor();
  return embedWindows(windows(text, extractor), extractor);
}

export async function embedQuestion(question: string): Promise<number[]> {
  if (!question.trim()) throw new Error("Cannot embed an empty question");
  const extractor = await getExtractor();
  const vectors = await embedWindows(windows(question, extractor), extractor);
  const mean = vectors[0].map((_, index) =>
    vectors.reduce((sum, vector) => sum + vector[index], 0) / vectors.length);
  return normalize(mean);
}
