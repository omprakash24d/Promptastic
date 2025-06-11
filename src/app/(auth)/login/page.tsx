
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chrome, Github, KeyRound, Mail, Phone, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const {
    signInWithGoogle,
    signInWithGithub,
    // signInWithPhoneNumber, // More complex, requires Recaptcha setup
    signUpWithEmail,
    signInWithEmail,
    sendPasswordReset,
    loading,
    error,
    successMessage, // Get success message
    clearAuthMessages, // Function to clear messages
  } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'signIn' | 'signUp'>('signIn');

  const [resetEmail, setResetEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [passwordMismatchError, setPasswordMismatchError] = useState<string | null>(null);

  useEffect(() => {
    // Clear messages when component mounts or when user switches forms
    return () => {
      clearAuthMessages();
    };
  }, [clearAuthMessages]);

  const handleTabChange = (value: string) => {
    clearAuthMessages();
    setPasswordMismatchError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setActiveTab(value as 'signIn' | 'signUp');
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthMessages();
    setPasswordMismatchError(null);

    if (activeTab === 'signUp') {
      if (password !== confirmPassword) {
        setPasswordMismatchError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
         // Firebase will also throw weak-password, but good to have client-side too
        setPasswordMismatchError("Password must be at least 6 characters long.");
        return;
      }
      await signUpWithEmail(email, password);
    } else {
      await signInWithEmail(email, password);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthMessages();
    await sendPasswordReset(resetEmail);
  };

  const handlePhoneSignIn = () => {
    alert("Phone Sign-In: Advanced setup required (RecaptchaVerifier). Not implemented in this placeholder.");
  };

  const getPasswordStrengthFeedback = () => {
    if (!password && activeTab === 'signUp') return null;
    if (password.length > 0 && password.length < 6 && activeTab === 'signUp') {
      return <p className="text-xs text-destructive mt-1">Password must be at least 6 characters.</p>;
    }
    // Placeholder for more advanced strength meter
    // if (password.length >= 6 && activeTab === 'signUp') {
    //   return <p className="text-xs text-green-600 mt-1">Password strength: Okay</p>;
    // }
    return null;
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <KeyRound className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">
            {showForgotPassword ? "Reset Password" : (activeTab === 'signUp' ? "Create an Account" : "Welcome Back!")}
          </CardTitle>
          {!showForgotPassword && (
            <CardDescription>
              {activeTab === 'signUp' ? "Enter your details to get started." : "Sign in to access your scripts."}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive">
              <AlertCircle className="mr-2 inline h-4 w-4" /> {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 rounded-md border border-green-500/50 bg-green-500/10 p-3 text-center text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="mr-2 inline h-4 w-4" /> {successMessage}
            </div>
          )}


          {showForgotPassword ? (
            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">Enter your email address and we'll send you a link to reset your password.</p>
              <div>
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Password Reset Email'}
              </Button>
            </form>
          ) : (
            <>
              <Tabs defaultValue="signIn" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="signIn">Sign In</TabsTrigger>
                  <TabsTrigger value="signUp">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="mt-1"
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="mt-1"
                        autoComplete={activeTab === 'signUp' ? "new-password" : "current-password"}
                      />
                      {getPasswordStrengthFeedback()}
                    </div>
                     {activeTab === 'signUp' && (
                        <div>
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                              id="confirm-password"
                              type="password"
                              placeholder="••••••••"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                              className="mt-1"
                              autoComplete="new-password"
                            />
                            {passwordMismatchError && <p className="text-xs text-destructive mt-1">{passwordMismatchError}</p>}
                        </div>
                    )}
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Processing...' : (activeTab === 'signUp' ? 'Sign Up' : 'Sign In')}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={signInWithGoogle} disabled={loading}>
                  <Chrome className="mr-2 h-5 w-5" /> Google
                </Button>
                <Button variant="outline" className="w-full" onClick={signInWithGithub} disabled={loading}>
                  <Github className="mr-2 h-5 w-5" /> GitHub
                </Button>
                <Button variant="outline" className="w-full" onClick={handlePhoneSignIn} disabled={loading}>
                  <Phone className="mr-2 h-5 w-5" /> Phone Number (Placeholder)
                </Button>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pt-4">
          {showForgotPassword ? (
            <Button variant="link" size="sm" onClick={() => { setShowForgotPassword(false); clearAuthMessages(); }} className="text-sm">
              Back to Sign In
            </Button>
          ) : (
            <>
              {/* Toggle between Sign In/Sign Up is now handled by Tabs */}
              <Button variant="link" size="sm" onClick={() => { setShowForgotPassword(true); setResetEmail(email); clearAuthMessages();}} className="text-sm text-muted-foreground hover:text-primary">
                Forgot Password?
              </Button>
            </>
          )}
           <p className="mt-4 text-center text-xs text-muted-foreground">
            Back to <Link href="/" className="underline hover:text-primary">Promptastic!</Link>
          </p>
        </CardFooter>
      </Card>
       {/* Hidden div for reCAPTCHA, if you implement phone auth */}
       {/* <div id="recaptcha-container-id"></div> */}
    </div>
  );
}
