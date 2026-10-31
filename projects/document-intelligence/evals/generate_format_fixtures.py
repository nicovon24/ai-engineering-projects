"""Generate small synthetic files for the local document intake review."""

from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


OUTPUT = Path(__file__).parent / "fixtures" / "formats"
SAMPLE = "Project Orion uses PostgreSQL for metadata and stores source documents separately."


def pdf_bytes(page_count: int, include_text: bool = True, sample: str = SAMPLE) -> bytes:
    objects: list[bytes] = []

    def add(body: bytes) -> int:
        objects.append(body)
        return len(objects)

    catalog_id = add(b"<< /Type /Catalog /Pages 2 0 R >>")
    pages_id = add(b"")
    font_id = add(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    page_ids: list[int] = []
    for index in range(page_count):
        text = (
            f"BT /F1 12 Tf 72 720 Td ({sample} Page {index + 1}.) Tj ET".encode("ascii")
            if include_text
            else b""
        )
        stream_id = add(
            f"<< /Length {len(text)} >>\nstream\n".encode("ascii")
            + text
            + b"\nendstream"
        )
        page_ids.append(
            add(
                f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 612 792] "
                f"/Resources << /Font << /F1 {font_id} 0 R >> >> "
                f"/Contents {stream_id} 0 R >>".encode("ascii")
            )
        )
    objects[pages_id - 1] = (
        f"<< /Type /Pages /Kids [{' '.join(f'{item} 0 R' for item in page_ids)}] "
        f"/Count {page_count} >>".encode("ascii")
    )

    output = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for number, body in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f"{number} 0 obj\n".encode("ascii") + body + b"\nendobj\n")
    xref = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode("ascii"))
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    output.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\n"
        f"startxref\n{xref}\n%%EOF\n".encode("ascii")
    )
    return bytes(output)


def make_docx(path: Path, sample: str = SAMPLE) -> None:
    content = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f"<w:body><w:p><w:r><w:t>{sample}</w:t></w:r></w:p></w:body></w:document>"
    )
    with ZipFile(path, "w", ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
            '</Types>'
        ))
        archive.writestr("_rels/.rels", (
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
            '</Relationships>'
        ))
        archive.writestr("word/document.xml", content)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / "text-one-page.pdf").write_bytes(pdf_bytes(1))
    (OUTPUT / "text-ten-pages.pdf").write_bytes(pdf_bytes(10))
    (OUTPUT / "text-eleven-pages.pdf").write_bytes(pdf_bytes(11))
    (OUTPUT / "textless-one-page.pdf").write_bytes(pdf_bytes(1, include_text=False))
    (OUTPUT / "notes.md").write_text(f"# Project Orion\n\n{SAMPLE}\n", encoding="utf-8")
    (OUTPUT / "notes.txt").write_text(SAMPLE, encoding="utf-8")
    (OUTPUT / "unsupported.csv").write_text(SAMPLE, encoding="utf-8")
    (OUTPUT / "empty.txt").write_bytes(b"")
    (OUTPUT / "invalid.txt").write_bytes(b"\xff\xfe\x00")
    (OUTPUT / "oversized.txt").write_bytes(b"A" * (10 * 1024 * 1024 + 1))
    make_docx(OUTPUT / "notes.docx")
    (OUTPUT / "eval-architecture.pdf").write_bytes(pdf_bytes(
        1,
        sample="Project Orion stores metadata in PostgreSQL. Original files are kept in object storage",
    ))
    make_docx(
        OUTPUT / "eval-maintenance.docx",
        "La inspeccion semanal revisa sensores y registra fallos en el cuaderno de mantenimiento.",
    )


if __name__ == "__main__":
    main()
