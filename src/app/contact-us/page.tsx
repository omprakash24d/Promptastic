
"use client";

import type React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// --- YOU NEED TO REPLACE THESE PLACEHOLDERS ---
// 1. Replace with your Google Form's Action URL
const GOOGLE_FORM_ACTION_URL = "YOUR_GOOGLE_FORM_ACTION_URL_HERE"; 

// 2. Replace with your Google Form's field entry IDs
//    Find these by inspecting your Google Form in Preview mode.
//    Each input field will have a `name` attribute like "entry.123456789".
const GOOGLE_FORM_FIELD_IDS = {
  name: "entry.XXXXXXXXXX",    // Replace XXXXXXXXXX with the entry ID for your "Name" field
  email: "entry.YYYYYYYYYY",   // Replace YYYYYYYYYY with the entry ID for your "Email" field
  subject: "entry.ZZZZZZZZZZ", // Replace ZZZZZZZZZZ with the entry ID for your "Subject" field
  message: "entry.AAAAAAAAAA", // Replace AAAAAAAAAA with the entry ID for your "Message" field
};
// --- END OF PLACEHOLDERS ---


export default function ContactUsPage() {
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formElement = e.target as HTMLFormElement;
    const formData = new FormData(formElement);

    if (!GOOGLE_FORM_ACTION_URL || GOOGLE_FORM_ACTION_URL === "YOUR_GOOGLE_FORM_ACTION_URL_HERE" || Object.values(GOOGLE_FORM_FIELD_IDS).some(id => id.startsWith("entry.X") || id.startsWith("entry.Y") || id.startsWith("entry.Z") || id.startsWith("entry.A"))) {
      toast({
        title: "Developer Note: Google Form Not Configured",
        description: "The contact form is not yet configured to send emails. Please update GOOGLE_FORM_ACTION_URL and GOOGLE_FORM_FIELD_IDS in src/app/contact-us/page.tsx with your Google Form details.",
        variant: "destructive",
        duration: 15000, 
      });
      console.warn("Contact form submission attempted, but Google Form details are not configured in the code.");
      console.log("Form Data (would be sent to Google Form):", {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
      });
      // formElement.reset(); // Optionally reset even if not configured
      return;
    }

    const dataToSubmit = new URLSearchParams();
    dataToSubmit.append(GOOGLE_FORM_FIELD_IDS.name, formData.get('name') as string);
    dataToSubmit.append(GOOGLE_FORM_FIELD_IDS.email, formData.get('email') as string);
    dataToSubmit.append(GOOGLE_FORM_FIELD_IDS.subject, formData.get('subject') as string);
    dataToSubmit.append(GOOGLE_FORM_FIELD_IDS.message, formData.get('message') as string);

    try {
      await fetch(GOOGLE_FORM_ACTION_URL, {
        method: 'POST',
        mode: 'no-cors', // Important: Google Forms don't allow CORS for responses from direct fetch.
                         // This means we can't know if submission was truly successful from the response,
                         // but the data is usually sent.
        headers: {
          // 'Content-Type': 'application/x-www-form-urlencoded', // Not strictly needed with URLSearchParams
        },
        body: dataToSubmit,
      });

      toast({
          title: "Message Sent!",
          description: "Thank you for your message. We'll review it shortly via our Google Form.",
          duration: 7000,
      });
      formElement.reset();
    } catch (error) {
      console.error("Error submitting to Google Form:", error);
      toast({
          title: "Submission Error",
          description: "There was an issue sending your message. Please try again later or contact us directly.",
          variant: "destructive",
          duration: 10000,
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader className="items-center">
            <Mail className="h-12 w-12 text-primary mb-3" />
            <CardTitle className="text-2xl md:text-3xl text-center">Contact Us</CardTitle>
            <CardDescription className="text-center">We'd love to hear from you! Send us a message or find us online.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                <p>
                If you have any questions, feedback, bug reports, or feature requests regarding Promptastic!, please don't hesitate to reach out using the form below. Your input will be submitted to our Google Form.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" type="text" placeholder="Your Name" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" type="text" placeholder="Regarding..." required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" placeholder="Your message here..." required rows={5} className="mt-1" />
              </div>
              <Button type="submit" className="w-full">Send Message</Button>
            </form>
            
            <Separator />

            <div className="text-center space-y-2">
                <p className="text-muted-foreground">You can also reach out directly via:</p>
                <p><strong>Email:</strong> <a href="mailto:help@indhinditech.com" className="text-primary hover:underline">help@indhinditech.com</a> </p>
                <p><strong>Instagram:</strong> <a href="https://www.instagram.com/omprakash24d/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@omprakash24d</a></p>
            </div>

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
      <Footer />
    </div>
  );
}
    
