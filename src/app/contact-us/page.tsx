
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
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

const GOOGLE_FORM_ACTION_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdz4Y6N6QO8PYBETvSkBBF6lLoq1rkRoj4TU9lZGuZim_3nzQ/formResponse";

const GOOGLE_FORM_FIELD_IDS = {
  name: "entry.998546520",
  email: "entry.1538728133",
  subject: "entry.1370750446",
  message: "entry.1209899467",
};

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const initialFormState: FormState = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

export default function ContactUsPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const validateField = (name: keyof FormState, value: string): string | undefined => {
    switch (name) {
      case 'name':
        return value.trim() ? undefined : 'Full Name is required.';
      case 'email':
        if (!value.trim()) return 'Email Address is required.';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email address.';
        return undefined;
      case 'subject':
        return value.trim() ? undefined : 'Subject is required.';
      case 'message':
        return value.trim() ? undefined : 'Message is required.';
      default:
        return undefined;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as { name: keyof FormState; value: string };
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (submissionStatus) setSubmissionStatus(null);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    (Object.keys(formData) as Array<keyof FormState>).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmissionStatus(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const dataToSubmit = new URLSearchParams();
    dataToSubmit.append(GOOGLE_FORM_FIELD_IDS.name, formData.name);
    dataToSubmit.append(GOOGLE_FORM_FIELD_IDS.email, formData.email);
    dataToSubmit.append(GOOGLE_FORM_FIELD_IDS.subject, formData.subject);
    dataToSubmit.append(GOOGLE_FORM_FIELD_IDS.message, formData.message);

    try {
      await fetch(GOOGLE_FORM_ACTION_URL, {
        method: 'POST',
        mode: 'no-cors', // Important for submitting to Google Forms to avoid CORS errors
        body: dataToSubmit,
      });

      setSubmissionStatus({ type: 'success', message: "Thank you for your message. We'll review it shortly." });
      setFormData(initialFormState); // Reset form fields
      setErrors({}); // Clear errors
    } catch (error) {
      console.error("Error submitting to Google Form:", error);
      setSubmissionStatus({ type: 'error', message: "There was an issue sending your message. Please try again later." });
    } finally {
      setIsLoading(false);
    }
  };
  
  const isSubmitDisabled = isLoading || 
                           !formData.name.trim() || 
                           !formData.email.trim() || 
                           !formData.subject.trim() || 
                           !formData.message.trim() ||
                           Object.values(errors).some(error => error !== undefined);


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
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={(e) => setErrors(prev => ({ ...prev, name: validateField('name', e.target.value) }))}
                  required
                  className={cn("mt-1", errors.name && "border-destructive focus-visible:ring-destructive")}
                  disabled={isLoading}
                  aria-invalid={!!errors.name}
                  aria-describedby="name-error"
                />
                {errors.name && <p id="name-error" className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={(e) => setErrors(prev => ({ ...prev, email: validateField('email', e.target.value) }))}
                  required
                  className={cn("mt-1", errors.email && "border-destructive focus-visible:ring-destructive")}
                  disabled={isLoading}
                  aria-invalid={!!errors.email}
                  aria-describedby="email-error"
                />
                {errors.email && <p id="email-error" className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="Regarding..."
                  value={formData.subject}
                  onChange={handleChange}
                  onBlur={(e) => setErrors(prev => ({ ...prev, subject: validateField('subject', e.target.value) }))}
                  required
                  className={cn("mt-1", errors.subject && "border-destructive focus-visible:ring-destructive")}
                  disabled={isLoading}
                  aria-invalid={!!errors.subject}
                  aria-describedby="subject-error"
                />
                {errors.subject && <p id="subject-error" className="text-xs text-destructive mt-1">{errors.subject}</p>}
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Your message here..."
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={(e) => setErrors(prev => ({ ...prev, message: validateField('message', e.target.value) }))}
                  required
                  rows={5}
                  className={cn("mt-1", errors.message && "border-destructive focus-visible:ring-destructive")}
                  disabled={isLoading}
                  aria-invalid={!!errors.message}
                  aria-describedby="message-error"
                />
                {errors.message && <p id="message-error" className="text-xs text-destructive mt-1">{errors.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
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

