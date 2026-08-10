import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
// Inlined as a raw string (not a separate asset URL) so the worker keeps
// working inside the single-file artifact build, which bundles everything
// into one HTML file with no other files to reference.
import pdfWorkerSource from 'pdfjs-dist/build/pdf.worker.min.mjs?raw';

const workerBlobUrl = URL.createObjectURL(new Blob([pdfWorkerSource], { type: 'text/javascript' }));
GlobalWorkerOptions.workerSrc = workerBlobUrl;

async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    pages.push(text.trim());
  }
  return pages.join('\n\n');
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Datei konnte nicht gelesen werden.'));
    reader.readAsText(file);
  });
}

export const SUPPORTED_TRANSCRIPT_EXTENSIONS = ['.txt', '.md', '.pdf'];

export async function readTranscriptFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return extractPdfText(file);
  if (name.endsWith('.txt') || name.endsWith('.md')) return readAsText(file);
  throw new Error(`Dateityp nicht unterstützt. Bitte ${SUPPORTED_TRANSCRIPT_EXTENSIONS.join(', ')} verwenden.`);
}
