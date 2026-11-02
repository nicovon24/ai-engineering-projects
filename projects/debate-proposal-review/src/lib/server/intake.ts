import { randomUUID } from "node:crypto";
import path from "node:path";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { SourceDocument } from "../types";

export type IntakeErrorCode = "INVALID_INPUT" | "EMPTY_SOURCE" | "UNSUPPORTED_TYPE" | "INVALID_TEXT" | "INVALID_FILE" | "TOO_LARGE" | "OCR_REQUIRED";

export class IntakeError extends Error {
  readonly code: IntakeErrorCode;

  constructor(code: IntakeErrorCode, message: string) {
    super(message);
    this.name = "IntakeError";
    this.code = code;
  }
}

const maxBytes = 5 * 1024 * 1024;
const maxChars = 40000;
const maxPassages = 50;
const passageChars = 4000;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function decodeText(bytes: Uint8Array): string {
  try {
    const value = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (/\0|[\x01-\x08\x0b\x0c\x0e-\x1f]/.test(value)) throw new Error("binary");
    return value;
  } catch {
    throw new IntakeError("INVALID_TEXT", "File is not valid UTF-8 text");
  }
}

function appendPassages(sourceId: string, blocks: { text: string; locator: string }[]): SourceDocument["passages"] {
  const passages: SourceDocument["passages"] = [];
  for (const block of blocks) {
    const content = block.text.trim();
    for (let offset = 0, part = 1; offset < content.length; offset += passageChars, part++) {
      if (passages.length === maxPassages) throw new IntakeError("TOO_LARGE", "Source has too many passages");
      const chunk = content.slice(offset, offset + passageChars);
      passages.push({ id: `${sourceId}:P${passages.length + 1}`, sourceId, locator: content.length > passageChars ? `${block.locator}, chunk ${part}` : block.locator, text: chunk });
    }
  }
  return passages;
}

function paragraphs(value: string): { text: string; locator: string }[] {
  return value.split(/\n\s*\n/).map((text, index) => ({ text, locator: `paragraph ${index + 1}` })).filter((block) => block.text.trim());
}

export async function parseSource(reviewId: string, input: { title?: string; text?: string; filename?: string; bytes?: Uint8Array }): Promise<SourceDocument> {
  if (!uuidPattern.test(reviewId) || !input || typeof input !== "object") throw new IntakeError("INVALID_INPUT", "Invalid source input");
  const hasText = input.text !== undefined;
  const hasFile = input.bytes !== undefined || input.filename !== undefined;
  if (hasText === hasFile) throw new IntakeError("INVALID_INPUT", "Provide text or one file");
  if (input.title !== undefined && (typeof input.title !== "string" || input.title.length > 200)) throw new IntakeError("INVALID_INPUT", "Invalid source title");

  let format: SourceDocument["format"];
  let blocks: { text: string; locator: string }[];
  if (hasText) {
    if (typeof input.text !== "string") throw new IntakeError("INVALID_INPUT", "Invalid pasted text");
    if (input.text.length > maxChars) throw new IntakeError("TOO_LARGE", "Source text is too long");
    format = "text";
    blocks = paragraphs(input.text);
  } else {
    if (typeof input.filename !== "string" || !input.filename.trim() || !(input.bytes instanceof Uint8Array)) throw new IntakeError("INVALID_INPUT", "Invalid file input");
    if (input.bytes.byteLength > maxBytes) throw new IntakeError("TOO_LARGE", "Source file is too large");
    if (input.bytes.byteLength === 0) throw new IntakeError("EMPTY_SOURCE", "Source file is empty");
    const extension = path.extname(input.filename).toLowerCase();
    if (extension !== ".txt" && extension !== ".md" && extension !== ".pdf" && extension !== ".docx") throw new IntakeError("UNSUPPORTED_TYPE", "Unsupported source type");
    format = extension.slice(1) as SourceDocument["format"];
    if (format === "txt" || format === "md") {
      blocks = paragraphs(decodeText(input.bytes));
    } else if (format === "docx") {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer: Buffer.from(input.bytes) });
        blocks = paragraphs(result.value);
      } catch {
        throw new IntakeError("INVALID_FILE", "Could not read DOCX file");
      }
    } else {
      let document: PDFDocumentProxy | undefined;
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        const task = pdfjs.getDocument({ data: new Uint8Array(input.bytes), useSystemFonts: true, disableFontFace: true });
        document = await task.promise;
        blocks = [];
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
          const page = await document.getPage(pageNumber);
          const text = await page.getTextContent();
          const value = text.items.map((item) => "str" in item ? item.str : "").join(" ").trim();
          if (value) blocks.push({ text: value, locator: `page ${pageNumber}` });
        }
      } catch {
        throw new IntakeError("INVALID_FILE", "Could not read PDF file");
      } finally {
        await document?.cleanup().catch(() => undefined);
      }
      if (blocks.length === 0) throw new IntakeError("OCR_REQUIRED", "PDF has no extractable text; OCR is required");
    }
  }
  const extractedLength = blocks.reduce((total, block) => total + block.text.length, 0);
  if (extractedLength > maxChars) throw new IntakeError("TOO_LARGE", "Extracted source text is too long");
  if (extractedLength === 0) throw new IntakeError("EMPTY_SOURCE", "Source has no usable text");
  const id = randomUUID();
  const passages = appendPassages(id, blocks);
  return {
    id, reviewId, title: input.title?.trim() || input.filename || "Pasted source",
    ...(input.filename ? { filename: input.filename } : {}), format, passages,
  };
}
