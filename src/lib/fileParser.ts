
"use client";

import type React from 'react';
import mammoth from 'mammoth';
import { getDocument, GlobalWorkerOptions, version as pdfjsVersion } from 'pdfjs-dist/build/pdf.mjs';
import { FileUp, FileText, FileCode2, FileType } from 'lucide-react'; // Added FileType for MD

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

export const fileTypes: FileTypeOption[] = [
  {
    label: "Import .txt",
    shortLabel: ".txt",
    accept: ".txt,text/plain",
    icon: FileUp,
    handler: async (file) => file.text(),
  },
  {
    label: "Import .pdf",
    shortLabel: ".pdf",
    accept: ".pdf,application/pdf",
    icon: FileCode2,
    handler: async (file) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        // Consider adding a size check here: if (arrayBuffer.byteLength > MAX_PDF_SIZE) throw new Error("File is too large");
        const pdf = await getDocument({data: arrayBuffer}).promise;
        let textContent = "";
        // Consider adding a page limit here: const numPagesToProcess = Math.min(pdf.numPages, MAX_PDF_PAGES);
        for (let i = 1; i <= pdf.numPages; i++) {
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
    }
  },
  {
    label: "Import .docx",
    shortLabel: ".docx",
    accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    icon: FileText,
    handler: async (file) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        // Consider adding a size check here
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      } catch (error) {
        console.error("Error parsing DOCX:", error);
        throw new Error("Could not extract text from DOCX. The file might be corrupted or in an unsupported format.");
      }
    }
  },
  {
    label: "Import .md",
    shortLabel: ".md",
    accept: ".md,text/markdown",
    icon: FileType, // Using FileType icon as a generic one for MD
    handler: async (file) => file.text(), // Markdown is plain text
    notes: "Markdown will be imported as raw text."
  },
  // Placeholder for HTML - HTML parsing can be complex due to sanitization needs
  // {
  //   label: "Import .html",
  //   shortLabel: ".html",
  //   accept: ".html,text/html",
  //   icon: FileCode2, // Or a more specific HTML icon
  //   handler: async (file) => {
  //     const rawHtml = await file.text();
  //     // IMPORTANT: Implement robust HTML sanitization here if you intend to render it,
  //     // or extract text content carefully. For teleprompter, usually text content is desired.
  //     // Example: Use DOMParser to get text content (client-side only)
  //     // if (typeof window !== 'undefined') {
  //     //   const parser = new DOMParser();
  //     //   const doc = parser.parseFromString(rawHtml, "text/html");
  //     //   return doc.body.textContent || "";
  //     // }
  //     // return rawHtml; // Or just return raw for now
  //     throw new Error(".html import is not fully implemented yet. Raw text would be imported.");
  //   },
  //   notes: "HTML content will be imported. Sanitization might be needed."
  // }
];
