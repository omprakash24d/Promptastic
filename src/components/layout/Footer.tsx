
"use client";

import type React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-8 mt-auto border-t bg-background print:hidden">
      <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
        <p>
          Designed and developed by{" "}
          <a
            href="https://www.instagram.com/omprakash24d/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary font-medium transition-colors duration-200"
          >
            Om Prakash
          </a>
          .
        </p>
        <div className="mt-2 space-x-4">
          <Link href="/privacy-policy" className="hover:text-primary hover:underline">
            Privacy Policy
          </Link>
          <span>&bull;</span>
          <Link href="/terms-conditions" className="hover:text-primary hover:underline">
            Terms & Conditions
          </Link>
           <span>&bull;</span>
          <Link href="/contact-us" className="hover:text-primary hover:underline">
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
}
