import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import { parseSource, IntakeError } from "../src/lib/server/intake.ts";

const reviewId = "73ae0565-f0ee-4f60-987a-92bc3e097f9e";
const invalid = (input, code) => assert.rejects(() => parseSource(reviewId, input), (error) => error instanceof IntakeError && error.code === code);

test("turns pasted, TXT, and MD text into review-owned passages", async () => {
  const paste = await parseSource(reviewId, { title: "Notes", text: "First point.\n\nSecond point." });
  assert.equal(paste.reviewId, reviewId);
  assert.equal(paste.format, "text");
  assert.equal(paste.passages[0].id, `${paste.id}:P1`);
  assert.match(paste.passages[0].locator, /paragraph|chunk/i);
  const txt = await parseSource(reviewId, { filename: "facts.txt", bytes: new TextEncoder().encode("Text evidence") });
  assert.equal(txt.format, "txt");
  assert.equal(txt.passages[0].text, "Text evidence");
  const md = await parseSource(reviewId, { filename: "facts.md", bytes: new TextEncoder().encode("# Heading\n\nMarkdown evidence") });
  assert.equal(md.format, "md");
  assert.equal(md.passages[1].text, "Markdown evidence");
});

test("rejects invalid, empty, oversized, unsupported, and binary text input", async () => {
  await invalid({ text: "" }, "EMPTY_SOURCE");
  await invalid({ filename: "x.csv", bytes: new TextEncoder().encode("a,b") }, "UNSUPPORTED_TYPE");
  await invalid({ filename: "x.txt", bytes: new Uint8Array([0, 1, 2]) }, "INVALID_TEXT");
  await invalid({ filename: "x.txt", bytes: new Uint8Array(5 * 1024 * 1024 + 1) }, "TOO_LARGE");
  await invalid({ text: "x".repeat(40001) }, "TOO_LARGE");
  await invalid({ filename: "x.pdf", bytes: new Uint8Array([1, 2, 3]) }, "INVALID_FILE");
});

function pdf(content) {
  const stream = content ? `BT /F1 12 Tf 72 720 Td (${content}) Tj ET` : "";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let result = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(result.length);
    result += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = result.length;
  result += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) result += `${String(offset).padStart(10, "0")} 00000 n \n`;
  result += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(result);
}

test("extracts digital PDF and DOCX and flags an image-only PDF for OCR", async () => {
  const digital = await parseSource(reviewId, { filename: "sample.pdf", bytes: pdf("PDF evidence") });
  assert.equal(digital.format, "pdf");
  assert.equal(digital.passages[0].text, "PDF evidence");
  assert.equal(digital.passages[0].locator, "page 1");
  await invalid({ filename: "scan.pdf", bytes: pdf("") }, "OCR_REQUIRED");

  const zip = new JSZip();
  zip.file("word/document.xml", '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>DOCX evidence</w:t></w:r></w:p></w:body></w:document>');
  const bytes = await zip.generateAsync({ type: "uint8array" });
  const docx = await parseSource(reviewId, { filename: "sample.docx", bytes });
  assert.equal(docx.format, "docx");
  assert.equal(docx.passages[0].text, "DOCX evidence");
});
