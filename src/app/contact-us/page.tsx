
import type React from 'react';
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer'; // Import Footer
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
    title: 'Contact Us',
    description: 'Get in touch with the Promptastic! team. Send us your questions, feedback, or feature requests.',
};

export default function ContactUsPage() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Placeholder: In a real app, you'd handle form submission here (e.g., send to an API endpoint)
    alert("Form submitted (placeholder action). Thank you for your message!");
    // Optionally reset form fields
    (e.target as HTMLFormElement).reset();
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
                If you have any questions, feedback, bug reports, or feature requests regarding Promptastic!, please don't hesitate to reach out.
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
                <p><strong>Email:</strong> <a href="mailto:support@prompt.indhinditech.com" className="text-primary hover:underline">support@prompt.indhinditech.com</a> (Placeholder)</p>
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
