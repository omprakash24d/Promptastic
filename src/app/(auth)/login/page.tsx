
"use client";

import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chrome, KeyRound, Mail, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, XCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const RESET_COOLDOWN_SECONDS = 30;

interface PasswordValidationState {
  minLength: boolean;
  hasNumber: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasSpecialChar: boolean;
}

const initialPasswordValidation: PasswordValidationState = {
  minLength: false,
  hasNumber: false,
  hasLowercase: false,
  hasUppercase: false,
  hasSpecialChar: false,
};

export default function LoginPage() {
  const {
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    sendPasswordReset,
    loading,
    error,
    successMessage,
    clearAuthMessages,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [activeTab, setActiveTab] = useState<'signIn' | 'signUp'>('signIn');
  const [showPassword, setShowPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [authAttemptError, setAuthAttemptError] = useState<string | null>(null);

  const [isResetCooldown, setIsResetCooldown] = useState(false);
  const [currentCooldownSeconds, setCurrentCooldownSeconds] = useState(RESET_COOLDOWN_SECONDS);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationState>(initialPasswordValidation);
  const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);

  const validatePassword = useCallback((currentPassword: string): boolean => {
    const newValidation = {
      minLength: currentPassword.length >= 8,
      hasNumber: /[0-9]/.test(currentPassword),
      hasLowercase: /[a-z]/.test(currentPassword),
      hasUppercase: /[A-Z]/.test(currentPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(currentPassword),
    };
    setPasswordValidation(newValidation);
    return Object.values(newValidation).every(Boolean);
  }, []);

  const allPasswordRulesMet = Object.values(passwordValidation).every(Boolean);

  useEffect(() => {
    clearAuthMessages();
    return () => {
      clearAuthMessages();
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, [clearAuthMessages, activeTab, showForgotPassword]);

  useEffect(() => {
    if (isResetCooldown) {
      cooldownIntervalRef.current = setInterval(() => {
        setCurrentCooldownSeconds(prev => {
          if (prev <= 1) {
            if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
            setIsResetCooldown(false);
            return RESET_COOLDOWN_SECONDS;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, [isResetCooldown]);

  const handleTabChange = (value: string) => {
    setAuthAttemptError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setShowForgotPassword(false);
    setPasswordValidation(initialPasswordValidation);
    setShowPasswordCriteria(false);
    setActiveTab(value as 'signIn' | 'signUp');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (activeTab === 'signUp') {
      validatePassword(newPassword);
      setShowPasswordCriteria(true);
    }
    if (authAttemptError) setAuthAttemptError(null);
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthAttemptError(null);
    clearAuthMessages();

    if (activeTab === 'signUp') {
      if (!displayName.trim()) {
        setAuthAttemptError("Display Name cannot be empty.");
        return;
      }
      if (password !== confirmPassword) {
        setAuthAttemptError("Passwords do not match.");
        return;
      }
      const isPasswordStillValid = validatePassword(password);
      if (!isPasswordStillValid) {
        setAuthAttemptError("Password does not meet all requirements.");
        return;
      }
      await signUpWithEmail(email, password, displayName);
    } else {
      await signInWithEmail(email, password);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthAttemptError(null); 
    clearAuthMessages();      
    const emailSentSuccessfully = await sendPasswordReset(resetEmail);

    if (emailSentSuccessfully) {
      setIsResetCooldown(true);
      setCurrentCooldownSeconds(RESET_COOLDOWN_SECONDS);
    }
  };

  const toggleForgotPasswordView = (show: boolean, prefillEmail?: string) => {
    setAuthAttemptError(null);
    setShowForgotPassword(show);
    if (show && prefillEmail) {
      setResetEmail(prefillEmail);
    } else if (!show) {
      setResetEmail('');
      if (isResetCooldown) {
        if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
        setIsResetCooldown(false);
        setCurrentCooldownSeconds(RESET_COOLDOWN_SECONDS);
      }
    }
  };

  const toggleShowPassword = () => setShowPassword(prev => !prev);

  const passwordCriteriaDisplay = [
    { rule: 'minLength', text: 'At least 8 characters', met: passwordValidation.minLength },
    { rule: 'hasUppercase', text: 'At least 1 uppercase letter (A-Z)', met: passwordValidation.hasUppercase },
    { rule: 'hasLowercase', text: 'At least 1 lowercase letter (a-z)', met: passwordValidation.hasLowercase },
    { rule: 'hasNumber', text: 'At least 1 number (0-9)', met: passwordValidation.hasNumber },
    { rule: 'hasSpecialChar', text: 'At least 1 special character (!@#$...etc)', met: passwordValidation.hasSpecialChar },
  ];
  
  const isSignupButtonDisabled = loading || (activeTab === 'signUp' && (!allPasswordRulesMet || !email || !password || !confirmPassword || !displayName));

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
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive" role="alert">
              <AlertCircle className="mr-2 inline h-4 w-4" /> {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 rounded-md border border-green-500/50 bg-green-500/10 p-3 text-center text-sm text-green-700 dark:text-green-400" role="status">
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
                  autoComplete="email"
                  aria-describedby="reset-email-description"
                />
                <p id="reset-email-description" className="sr-only">Enter the email associated with your account to receive a password reset link.</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading || isResetCooldown}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isResetCooldown ? `Resend in ${currentCooldownSeconds}s` : (loading ? 'Sending...' : 'Send Password Reset Email')}
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
                    {activeTab === 'signUp' && (
                      <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your Name"
                          required
                          className="mt-1"
                          autoComplete="name"
                        />
                      </div>
                    )}
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
                    <div className="relative">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={handlePasswordChange}
                        onFocus={() => { if (activeTab === 'signUp') setShowPasswordCriteria(true);}}
                        placeholder="••••••••"
                        required
                        className="mt-1 pr-10" 
                        autoComplete={activeTab === 'signUp' ? "new-password" : "current-password"}
                        aria-describedby={activeTab === 'signUp' ? "password-criteria" : undefined}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-7 h-7 px-2"
                        onClick={toggleShowPassword}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>

                    {activeTab === 'signUp' && showPasswordCriteria && (
                      <div id="password-criteria" className="mt-2 space-y-1 text-xs" aria-live="polite">
                        {passwordCriteriaDisplay.map((item) => (
                          <div key={item.rule} className={cn("flex items-center", item.met ? 'text-green-600 dark:text-green-400' : 'text-destructive')}>
                            {item.met ? <CheckCircle2 className="mr-2 h-3.5 w-3.5 flex-shrink-0" /> : <XCircle className="mr-2 h-3.5 w-3.5 flex-shrink-0" />}
                            {item.text}
                          </div>
                        ))}
                      </div>
                    )}

                     {activeTab === 'signUp' && (
                        <div className="relative">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                              id="confirm-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={confirmPassword}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (authAttemptError) setAuthAttemptError(null);
                              }}
                              required
                              className="mt-1 pr-10"
                              autoComplete="new-password"
                            />
                             <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-7 h-7 px-2"
                                onClick={toggleShowPassword}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                             >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    )}
                    {authAttemptError && (
                        <p className="text-xs text-destructive mt-1 px-1" role="alert">{authAttemptError}</p>
                    )}
                    <Button type="submit" className="w-full" disabled={activeTab === 'signUp' ? isSignupButtonDisabled : loading}>
                       {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
                   {loading && !email && !password ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="mr-2 h-5 w-5" /> }
                   {loading && !email && !password ? 'Signing in...' : 'Google'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pt-4">
          {showForgotPassword ? (
            <Button variant="link" size="sm" onClick={() => toggleForgotPasswordView(false)} className="text-sm">
              Back to Sign In
            </Button>
          ) : (
            <>
              <Button variant="link" size="sm" onClick={() => toggleForgotPasswordView(true, email)} className="text-sm text-muted-foreground hover:text-primary">
                Forgot Password?
              </Button>
            </>
          )}
           <p className="mt-4 text-center text-xs text-muted-foreground">
            Back to <Link href="/" className="underline hover:text-primary">Promptastic!</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
