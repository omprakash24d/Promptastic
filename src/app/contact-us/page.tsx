
"use client";

import type React from 'react';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// --- THESE VALUES ARE NOW UPDATED BASED ON YOUR PREFILLED LINK ---
// 1. Google Form's Action URL
const GOOGLE_FORM_ACTION_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdz4Y6N6QO8PYBETvSkBBF6lLoq1rkRoj4TU9lZGuZim_3nzQ/formResponse"; 

// 2. Google Form's field entry IDs
const GOOGLE_FORM_FIELD_IDS = {
  name: "entry.998546520",
  email: "entry.1538728133",
  subject: "entry.1370750446",
  message: "entry.1209899467",
};
// --- END OF UPDATED VALUES ---


export default function ContactUsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmissionStatus(null);
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
      setIsLoading(false);
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
        mode: 'no-cors', 
        body: dataToSubmit,
      });

      setSubmissionStatus({ type: 'success', message: "Thank you for your message. We'll review it shortly." });
      formElement.reset();
    } catch (error) {
      console.error("Error submitting to Google Form:", error);
      setSubmissionStatus({ type: 'error', message: "There was an issue sending your message. Please try again later." });
    } finally {
      setIsLoading(false);
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
                <Input 
                  id="name" 
                  name="name" 
                  type="text" 
                  placeholder="Your Name" 
                  required 
                  className="mt-1" 
                  disabled={isLoading}
                  onChange={() => submissionStatus && setSubmissionStatus(null)} 
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  required 
                  className="mt-1" 
                  disabled={isLoading}
                  onChange={() => submissionStatus && setSubmissionStatus(null)} 
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  name="subject" 
                  type="text" 
                  placeholder="Regarding..." 
                  required 
                  className="mt-1" 
                  disabled={isLoading}
                  onChange={() => submissionStatus && setSubmissionStatus(null)} 
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  name="message" 
                  placeholder="Your message here..." 
                  required 
                  rows={5} 
                  className="mt-1" 
                  disabled={isLoading}
                  onChange={() => submissionStatus && setSubmissionStatus(null)} 
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </Button>
              {submissionStatus && (
                <div
                  className={cn(
                    "mt-2 text-center text-sm p-2 rounded-md",
                    submissionStatus.type === 'success' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}
                  role={submissionStatus.type === 'error' ? "alert" : "status"}
                >
                  {submissionStatus.type === 'success' ? 
                    <CheckCircle2 className="inline mr-1.5 h-4 w-4" /> :
                    <AlertCircle className="inline mr-1.5 h-4 w-4" />
                  }
                  {submissionStatus.message}
                </div>
              )}
            </form>
            
            <Separator />

            <div className="text-center space-y-2">
                <p className="text-muted-foreground">You can also reach out directly via:</p>
                <p><strong>Email:</strong> <a href="mailto:help@indhinditech.com" className="text-primary hover:underline">help@indhinditech.com</a> </p>
                <p><strong>Instagram:</strong> <a href="https://www.instagram.com/omprakash24d/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@omprakash24d</a></p>
            </div>

            <div className="mt-8 text-center">
              <Button asChild variant="outline" disabled={isLoading}>
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
    
