
"use client";

import type React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer'; // Import Footer
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Gavel } from 'lucide-react';


export default function TermsConditionsPage() {
  const dummyOpen = () => {};

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onOpenScripts={dummyOpen} onOpenSettings={dummyOpen} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader className="items-center">
            <Gavel className="h-12 w-12 text-primary mb-3" />
            <CardTitle className="text-2xl md:text-3xl text-center">Terms & Conditions</CardTitle>
            <CardDescription className="text-center">Please read these terms carefully before using Promptastic!.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm sm:prose-base dark:prose-invert max-w-none">
            <p className="text-muted-foreground text-center">Last updated: {new Date().toLocaleDateString()}</p>

            <p>Please read these Terms and Conditions ("Terms", "Terms and Conditions") carefully before using the Promptastic! application (the "Service") operated by Om Prakash ("us", "we", or "our").</p>
            <p>Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.</p>
            <p>By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.</p>

            <h2 className="text-xl font-semibold mt-6">1. Accounts</h2>
            <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
            <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.</p>
            <p>You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>

            <h2 className="text-xl font-semibold mt-6">2. User Content</h2>
            <p>Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). This primarily refers to the scripts you create and use within the teleprompter. You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.</p>
            <p>By posting Content to the Service, you grant us the right and license to store and process such Content on and through the Service solely for the purpose of operating and providing the Service to you. You retain any and all of your rights to any Content you submit, post or display on or through the Service and you are responsible for protecting those rights.</p>
            <p>You represent and warrant that: (i) the Content is yours (you own it) or you have the right to use it and grant us the rights and license as provided in these Terms, and (ii) the posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person.</p>
            <p>We reserve the right to remove any Content that violates these Terms or is otherwise objectionable, in our sole discretion, particularly if it poses a security risk or violates legal requirements.</p>

            <h2 className="text-xl font-semibold mt-6">3. Acceptable Use</h2>
            <p>You agree not to use the Service:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>In any way that violates any applicable national or international law or regulation.</li>
              <li>For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise.</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation through any communication features we might offer.</li>
              <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
              <li>In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity.</li>
              <li>To engage in any other conduct that restricts or inhibits anyone’s use or enjoyment of the Service, or which, as determined by us, may harm the Company or users of the Service or expose them to liability.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6">4. Intellectual Property</h2>
            <p>The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of Om Prakash and its licensors. The Service is protected by copyright, trademark, and other laws of both India and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Om Prakash.</p>

            <h2 className="text-xl font-semibold mt-6">5. Termination</h2>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
            <p>Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service or contact us to request account deletion as per our Privacy Policy.</p>

            <h2 className="text-xl font-semibold mt-6">6. Limitation Of Liability</h2>
            <p>In no event shall Om Prakash, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.</p>

            <h2 className="text-xl font-semibold mt-6">7. Disclaimer</h2>
            <p>Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.</p>
            <p>Om Prakash its subsidiaries, affiliates, and its licensors do not warrant that a) the Service will function uninterrupted, secure or available at any particular time or location; b) any errors or defects will be corrected; c) the Service is free of viruses or other harmful components; or d) the results of using the Service will meet your requirements.</p>

            <h2 className="text-xl font-semibold mt-6">8. Governing Law</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>
            <p>Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Service, and supersede and replace any prior agreements we might have between us regarding the Service.</p>

            <h2 className="text-xl font-semibold mt-6">9. Changes</h2>
            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
            <p>By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.</p>

            <h2 className="text-xl font-semibold mt-6">10. Contact Us</h2>
            <p>If you have any questions about these Terms, please visit our <Link href="/contact-us" className="text-primary hover:underline">Contact Us page</Link> or email us at:</p>
            <p>Email: <a href="mailto:terms@prompt.indhinditech.com" className="text-primary hover:underline">terms@prompt.indhinditech.com</a> (Placeholder)</p>
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
      <Footer />
    </div>
  );
}
