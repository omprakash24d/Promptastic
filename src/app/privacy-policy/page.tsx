
"use client";

import type React from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck } from 'lucide-react';


export default function PrivacyPolicyPage() {
  const dummyOpen = () => {};

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onOpenScripts={dummyOpen} onOpenSettings={dummyOpen} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader className="items-center">
            <ShieldCheck className="h-12 w-12 text-primary mb-3" />
            <CardTitle className="text-2xl md:text-3xl text-center">Privacy Policy</CardTitle>
            <CardDescription className="text-center">How Promptastic! handles your data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm sm:prose-base dark:prose-invert max-w-none">
            <p className="text-muted-foreground text-center">Last updated: {new Date().toLocaleDateString()}</p>

            <p>Welcome to Promptastic! This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.</p>

            <h2 className="text-xl font-semibold mt-6">1. Information We Collect</h2>
            <p>We may collect information about you in a variety of ways. The information we may collect via the Application depends on the content and materials you use, and includes:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and display name, that you voluntarily give to us when you register with the Application. Profile pictures are also stored if you upload one.</li>
              <li><strong>Script Data:</strong> Any scripts, text, or content you input, upload, or save within the teleprompter functionality of the Application. If you are a logged-in user, this data is stored in our secure cloud database (Firebase Firestore). For anonymous users, this data is stored locally in your browser.</li>
              <li><strong>Usage Data:</strong> We may automatically collect standard log information and usage details, such as IP address, browser type, operating system, access times, and pages viewed directly before and after accessing the Application. This is primarily for analytics and improving our service. (Currently, extensive usage tracking is not implemented beyond standard server logs if applicable).</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6">2. Use of Your Information</h2>
            <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Create and manage your account.</li>
              <li>Provide and manage your scripts and teleprompter settings.</li>
              <li>Store and display your profile picture.</li>
              <li>Enable user-to-user communications (if such features are implemented).</li>
              <li>Email you regarding your account or order (e.g., password resets, email verification).</li>
              <li>Improve the Application and develop new features.</li>
              <li>Monitor and analyze usage and trends to improve your experience with the Application.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6">3. Disclosure of Your Information</h2>
            <p>We do not share your personal information with third parties except as described in this Privacy Policy or with your consent.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
              <li><strong>Third-Party Service Providers:</strong> We use Firebase for authentication, database (Firestore), and storage services. Google's privacy policy applies to their services. We also use Genkit for AI features, which may interact with Google AI models.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6">4. Security of Your Information</h2>
            <p>We use administrative, technical, and physical security measures to help protect your personal information. Firebase provides robust security for its services. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>

            <h2 className="text-xl font-semibold mt-6">5. Policy for Children</h2>
            <p>We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below.</p>
            
            <h2 className="text-xl font-semibold mt-6">6. Your Data Rights</h2>
            <p>You have the right to access, update, or delete your personal information. You can manage your account information (display name, profile picture) through your profile page within the application. To delete your account and associated data, please contact us.</p>

            <h2 className="text-xl font-semibold mt-6">7. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.</p>

            <h2 className="text-xl font-semibold mt-6">8. Contact Us</h2>
            <p>If you have questions or comments about this Privacy Policy, please visit our <Link href="/contact-us" className="text-primary hover:underline">Contact Us page</Link> or email us at:</p>
            <p>Email: <a href="mailto:privacy@prompt.indhinditech.com" className="text-primary hover:underline">privacy@prompt.indhinditech.com</a> (Placeholder)</p>
            <p>Via Instagram: <a href="https://www.instagram.com/omprakash24d/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@omprakash24d</a></p>

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
