import { createHash } from "node:crypto";
import mammoth from "mammoth";
import { AppError } from "./errors";
import { MAX_EXTRACTED_CHARS, MAX_FILE_BYTES, MAX_PDF_PAGES } from "./limits";
import type { DocumentRecord, Passage } from "./types";

type ExtractedPage = { page: number | null; text: string };

function makePassages(documentId: string, pages: ExtractedPage[]): Passage[] {
  const passages: Passage[] = [];
  for (const source of pages) {
    const text = source.text.replace(/\r\n?/g, "\n");
    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + 850, text.length);
      if (end < text.length) {
        const breakAt = Math.max(text.lastIndexOf("\n", end), text.lastIndexOf(". ", end));
        if (breakAt > start + 450) end = breakAt + 1;
      }
      const raw = text.slice(start, end);
      const leading = raw.length - raw.trimStart().length;
      const trailing = raw.length - raw.trimEnd().length;
      const passageStart = start + leading;
      const passageEnd = end - trailing;
      const value = text.slice(passageStart, passageEnd);
      if (value.length >= 20) {
        const id = createHash("sha256")
          .update(`${documentId}:${source.page ?? 0}:${passageStart}:${passageEnd}:${value}`)
          .digest("hex")
          .slice(0, 24);
        passages.push({
          id,
          documentId,
          page: source.page,
          startOffset: passageStart,
          endOffset: passageEnd,
          text: value,
        });
      }
      if (end === text.length) break;
      start = Math.max(end - 100, start + 1);
    }
  }
  return passages;
}

async function extractPdf(buffer: Buffer): Promise<ExtractedPage[]> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({ data: new Uint8Array(buffer), useSystemFonts: true });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > MAX_PDF_PAGES) throw new AppError("too_many_pages");
    const pages: ExtractedPage[] = [];
    let totalChars = 0;
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : " ") : ""))
        .join("")
        .trim();
      totalChars += text.length;
      if (totalChars > MAX_EXTRACTED_CHARS) throw new AppError("too_much_text");
      pages.push({ page: pageNumber, text });
    }
    if (totalChars < 20) throw new AppError("scanned_pdf");
    return pages;
  } finally {
    await task.destroy();
  }
}

export async function parseDocument(file: File, documentId: string): Promise<DocumentRecord> {
  if (file.size === 0) throw new AppError("empty_file");
  if (file.size > MAX_FILE_BYTES) throw new AppError("file_too_large");

  const name = file.name.replace(/[\\/\u0000-\u001f]/g, "_").slice(0, 120);
  const extension = name.toLowerCase().split(".").pop();
  if (extension !== "pdf" && extension !== "txt" && extension !== "md" && extension !== "docx") {
    throw new AppError("unsupported_file");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let pages: ExtractedPage[];
  if (extension === "pdf") {
    if (buffer.subarray(0, 5).toString() !== "%PDF-") throw new AppError("invalid_file");
    try {
      pages = await extractPdf(buffer);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("invalid_file");
    }
  } else if (extension === "docx") {
    if (buffer.subarray(0, 2).toString() !== "PK") throw new AppError("invalid_file");
    try {
      const result = await mammoth.extractRawText({ buffer });
      pages = [{ page: null, text: result.value.trim() }];
    } catch {
      throw new AppError("invalid_file");
    }
  } else {
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      pages = [{ page: null, text: text.trim() }];
    } catch {
      throw new AppError("invalid_file");
    }
  }

  if (pages.reduce((total, page) => total + page.text.length, 0) > MAX_EXTRACTED_CHARS) {
    throw new AppError("too_much_text");
  }
  if (!pages.some((page) => page.text.trim().length >= 20)) throw new AppError("empty_text");

  const passages = makePassages(documentId, pages);
  if (passages.length === 0) throw new AppError("empty_text");
  const mediaType = {
    pdf: "application/pdf",
    txt: "text/plain; charset=utf-8",
    md: "text/markdown; charset=utf-8",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }[extension];

  return {
    id: documentId,
    name,
    mediaType,
    extension,
    size: file.size,
    pageCount: extension === "pdf" ? pages.length : null,
    uploadedAt: new Date().toISOString(),
    passages,
  };
}
