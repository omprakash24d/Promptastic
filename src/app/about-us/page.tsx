
"use client";

import type React from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Info } from 'lucide-react';

export default function AboutUsPage() {
  const dummyOpen = () => {}; // Placeholder for Header props

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onOpenScripts={dummyOpen} onOpenSettings={dummyOpen} onOpenHelp={dummyOpen} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader className="items-center">
            <Info className="h-12 w-12 text-primary mb-3" />
            <CardTitle className="text-2xl md:text-3xl text-center">About Promptastic!</CardTitle>
            <CardDescription className="text-center">Learn more about our mission and the team behind Promptastic!.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm sm:prose-base dark:prose-invert max-w-none">
            <p>Welcome to Promptastic!, your modern solution for seamless script delivery and presentation.</p>
            
            <h2 className="text-xl font-semibold mt-6">Our Mission</h2>
            <p>
              Our mission is to empower presenters, content creators, educators, and public speakers with a reliable, intuitive, and feature-rich teleprompter application. We believe that clear communication is key, and Promptastic! is designed to help you deliver your message with confidence and professionalism.
            </p>

            <h2 className="text-xl font-semibold mt-6">What is Promptastic!?</h2>
            <p>
              Promptastic! is a cutting-edge teleprompter application built with the latest web technologies, including Next.js, React, and Tailwind CSS. It offers a clean, distraction-free interface, real-time customization of text appearance and scroll speed, robust script management (including versioning and cloud sync for logged-in users), and AI-powered features like script summarization.
            </p>

            <h2 className="text-xl font-semibold mt-6">Key Features</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Comprehensive Script Management: Create, edit, save, load, import, export, and version your scripts.</li>
              <li>Cloud Sync: Logged-in users' scripts are securely stored and synced via Firebase Firestore.</li>
              <li>Customizable Teleprompter View: Adjust font size, scroll speed, line spacing, colors, and more.</li>
              <li>Special Cues: Use `//PAUSE//`, `//EMPHASIZE//`, `//SLOWDOWN//` for visual prompting.</li>
              <li>AI-Powered Tools: Script summarization and experimental AI scroll sync.</li>
              <li>Multiple Themes: Light, Dark, and High-Contrast modes for optimal readability.</li>
              <li>Responsive Design: Works great on desktops, tablets, and mobile devices.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6">The Developer</h2>
            <p>
              Promptastic! was conceived, designed, and developed by Om Prakash, a passionate software developer dedicated to creating useful and high-quality applications.
            </p>
            <p>
              Connect with Om Prakash on <a href="https://www.instagram.com/omprakash24d/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Instagram @omprakash24d</a>.
            </p>

            <div className="mt-8 text-center">
              <Button asChild variant="outline">
                <Link href="/">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Promptastic!
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
