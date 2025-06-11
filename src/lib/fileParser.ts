
"use client";

import type React from 'react';
import mammoth from 'mammoth';
import { getDocument, GlobalWorkerOptions, version as pdfjsVersion } from 'pdfjs-dist/build/pdf.mjs';
import { FileUp, FileText, FileCode2, FileType } from 'lucide-react'; // FileType for MD

if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.mjs`;
}

export interface FileTypeOption {
  label: string;
  shortLabel: string;
  accept: string;
  icon: React.ElementType;
  handler: (file: File) => Promise<string | null>;
  notes?: string;
}

// Define some reasonable limits (can be configurable later)
const MAX_PDF_PAGES = 50;
const MAX_FILE_SIZE_MB = 10; // For DOCX, PDF
const MAX_TEXT_FILE_SIZE_MB = 5; // For TXT, MD

export const fileTypes: FileTypeOption[] = [
  {
    label: "Import .txt",
    shortLabel: ".txt",
    accept: ".txt,text/plain",
    icon: FileUp,
    handler: async (file) => {
      if (file.size > MAX_TEXT_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`Text file is too large. Max size: ${MAX_TEXT_FILE_SIZE_MB}MB.`);
      }
      return file.text();
    },
  },
  {
    label: "Import .md",
    shortLabel: ".md",
    accept: ".md,text/markdown",
    icon: FileType, // Using FileType icon
    handler: async (file) => {
      if (file.size > MAX_TEXT_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`Markdown file is too large. Max size: ${MAX_TEXT_FILE_SIZE_MB}MB.`);
      }
      return file.text();
    },
    notes: "Markdown will be imported as raw text."
  },
  {
    label: "Import .pdf",
    shortLabel: ".pdf",
    accept: ".pdf,application/pdf",
    icon: FileCode2,
    handler: async (file) => {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`PDF file is too large. Max size: ${MAX_FILE_SIZE_MB}MB.`);
      }
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({data: arrayBuffer}).promise;
        
        if (pdf.numPages > MAX_PDF_PAGES) {
          console.warn(`PDF has ${pdf.numPages} pages. Processing only the first ${MAX_PDF_PAGES} pages.`);
        }
        const numPagesToProcess = Math.min(pdf.numPages, MAX_PDF_PAGES);
        
        let textContent = "";
        for (let i = 1; i <= numPagesToProcess; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map(item => ('str' in item ? item.str : '')).join(" ") + "\n";
        }
        return textContent;
      } catch (error) {
          console.error("Error parsing PDF:", error);
          if (error instanceof Error && error.name === 'PasswordException') {
            throw new Error("Cannot import password-protected PDF.");
          }
          throw new Error("Could not extract text from PDF. It might be corrupted, image-based, or password-protected.");
      }
    },
    notes: `Max ${MAX_PDF_PAGES} pages & ${MAX_FILE_SIZE_MB}MB.`
  },
  {
    label: "Import .docx",
    shortLabel: ".docx",
    accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    icon: FileText,
    handler: async (file) => {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`DOCX file is too large. Max size: ${MAX_FILE_SIZE_MB}MB.`);
      }
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      } catch (error) {
        console.error("Error parsing DOCX:", error);
        throw new Error("Could not extract text from DOCX. The file might be corrupted or in an unsupported format.");
      }
    },
    notes: `Max ${MAX_FILE_SIZE_MB}MB.`
  },
  // Placeholder for HTML - More complex due to sanitization.
  // {
  //   label: "Import .html",
  //   shortLabel: ".html",
  //   accept: ".html,text/html",
  //   icon: FileCode2, 
  //   handler: async (file) => {
  //     if (file.size > MAX_TEXT_FILE_SIZE_MB * 1024 * 1024) {
  //       throw new Error(`HTML file is too large. Max size: ${MAX_TEXT_FILE_SIZE_MB}MB.`);
  //     }
  //     const rawHtml = await file.text();
  //     if (typeof window !== 'undefined') { // Basic client-side text extraction
  //       const parser = new DOMParser();
  //       const doc = parser.parseFromString(rawHtml, "text/html");
  //       return doc.body.textContent || "";
  //     }
  //     return rawHtml; // Fallback for non-browser or simple case
  //   },
  //   notes: "HTML content will be converted to plain text."
  // }
];

