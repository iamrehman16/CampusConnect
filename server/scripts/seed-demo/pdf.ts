import PDFDocument from 'pdfkit';
import type { SeedResource } from './data/resources';

// DejaVu covers the Greek letters and maths symbols used in the notes
// (λ, Σ, ∂, ≈, ⊕, ⁻¹); PDFKit's built-in Helvetica would garble them, and
// LlamaParse would then feed garbled text to the RAG index.
const FONT_REGULAR = require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans.ttf');
const FONT_BOLD = require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf');

/** Renders a seed resource as a simple, readable lecture-notes PDF. */
export function renderResourcePdf(
  resource: SeedResource,
  authorName: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 64, bottom: 64, left: 64, right: 64 },
      info: { Title: resource.title, Author: authorName },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.registerFont('regular', FONT_REGULAR);
    doc.registerFont('bold', FONT_BOLD);

    doc
      .font('regular')
      .fontSize(9)
      .fillColor('#666666')
      .text(
        `${resource.course} · ${resource.subject} · Semester ${resource.semester}`,
      );
    doc.moveDown(0.4);
    doc.font('bold').fontSize(20).fillColor('#111111').text(resource.title);
    doc.moveDown(0.3);
    doc
      .font('regular')
      .fontSize(10)
      .fillColor('#444444')
      .text(`Prepared by ${authorName}`);
    doc.moveDown(1.2);

    for (const section of resource.sections) {
      doc.font('bold').fontSize(13).fillColor('#111111').text(section.heading);
      doc.moveDown(0.4);
      for (const paragraph of section.paragraphs) {
        doc
          .font('regular')
          .fontSize(11)
          .fillColor('#222222')
          .text(paragraph, { align: 'left', lineGap: 3 });
        doc.moveDown(0.6);
      }
      doc.moveDown(0.6);
    }

    doc.end();
  });
}
