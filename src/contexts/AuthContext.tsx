
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { AuthUser } from '@/types';
import { usePathname, useRouter } from 'next/navigation'; // Import usePathname
import { auth } from '@/firebase/config';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  sendEmailVerification,
  type User as FirebaseUser, // Import FirebaseUser type
} from 'firebase/auth';

const MESSAGE_CLEAR_TIMEOUT = 7000; // 7 seconds

const FIREBASE_ERROR_MESSAGES: { [key: string]: string } = {
  'auth/user-not-found': 'Invalid email or password. Please try again.',
  'auth/wrong-password': 'Invalid email or password. Please try again.',
  'auth/invalid-credential': 'Invalid email or password. Please try again.',
  'auth/email-already-in-use': 'This email address is already in use by another account.',
  'auth/weak-password': 'Password is too weak. It should meet all specified strength requirements.',
  'auth/requires-recent-login': 'This action requires a recent login. Please sign out and sign in again to continue.',
  'auth/account-exists-with-different-credential': 'An account already exists with this email, but with a different sign-in method (e.g., Google). Try signing in with that method.',
  'auth/invalid-email': 'The email address format is not valid. Please check and try again.',
  'auth/unauthorized-domain': 'This domain is not authorized for Firebase operations. Please check your Firebase project configuration or contact support.',
  'auth/network-request-failed': 'A network error occurred. Please check your internet connection and try again.',
  'auth/too-many-requests': 'Access to this account has been temporarily disabled due to many failed login attempts. You can try again later or reset your password.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
  'auth/user-disabled': 'This user account has been disabled. Please contact support.',
};


interface AuthContextType {
  user: AuthUser | null;
  isEmailVerified: boolean | undefined;
  // Specific loading states
  loginLoading: boolean;
  signupLoading: boolean;
  passwordResetLoading: boolean;
  profileUpdateLoading: boolean;
  verificationResendLoading: boolean;
  googleSignInLoading: boolean;
  
  error: string | null;
  successMessage: string | null;

  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<boolean>; // Returns success boolean
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
  logout: () => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  clearAuthMessages: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to parse Firebase User
const parseFirebaseUser = (firebaseUser: FirebaseUser | null): AuthUser | null => {
  if (!firebaseUser) return null;
  const { uid, email, displayName, phoneNumber, photoURL, emailVerified } = firebaseUser;
  return { uid, email, displayName, phoneNumber, photoURL, isEmailVerified: emailVerified };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | undefined>(undefined);

  // Specific loading states
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  const [verificationResendLoading, setVerificationResendLoading] = useState(false);
  const [googleSignInLoading, setGoogleSignInLoading] = useState(false);
  const [initialAuthLoading, setInitialAuthLoading] = useState(true);


  const [error, setErrorState] = useState<string | null>(null);
  const [successMessage, setSuccessMessageState] = useState<string | null>(null);
  
  const router = useRouter();
  const pathname = usePathname(); // Use usePathname hook

  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setError = useCallback((message: string | null) => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setErrorState(message);
    if (message) {
      errorTimeoutRef.current = setTimeout(() => setErrorState(null), MESSAGE_CLEAR_TIMEOUT);
    }
  }, []);

  const setSuccessMessage = useCallback((message: string | null) => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    setSuccessMessageState(message);
    if (message) {
      successTimeoutRef.current = setTimeout(() => setSuccessMessageState(null), MESSAGE_CLEAR_TIMEOUT);
    }
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const parsedUser = parseFirebaseUser(firebaseUser);
      setUser(parsedUser);
      setIsEmailVerified(firebaseUser?.emailVerified);
      setInitialAuthLoading(false);
    });
    return () => {
      unsubscribe();
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const clearAuthMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, [setError, setSuccessMessage]);

  const handleAuthSuccess = useCallback((message?: string, options: { fromSignup?: boolean, redirectTo?: string, skipRedirect?: boolean } = {}) => {
    const { fromSignup = false, redirectTo = '/', skipRedirect = false } = options;
    setError(null);
    let finalMessage = message;

    if (fromSignup && auth.currentUser && !auth.currentUser.emailVerified) {
      finalMessage = "Account created! Please check your email to verify your account.";
    } else if (fromSignup) {
      finalMessage = message || "Account created successfully!";
    }
    
    if (finalMessage) setSuccessMessage(finalMessage);
    else setSuccessMessage(null);

    if (!skipRedirect && pathname !== redirectTo) { 
        router.push(redirectTo);
    }
  }, [setError, setSuccessMessage, router, pathname]);

  const handleAuthError = useCallback((err: any, operation?: 'passwordReset' | 'signup') => {
    setSuccessMessage(null); 
    const userCancellableErrors = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

    if (err.code && userCancellableErrors.includes(err.code)) {
      // setError('The sign-in process was cancelled.'); // Simplified message
      // Do not set an error for user-cancelled popups, just let them try again.
      clearAuthMessages();
      return;
    }
    
    // For password reset, always show generic success if it's just user-not-found
    if (err.code === 'auth/user-not-found' && operation === 'passwordReset') {
      setError(null); // Clear any potential error
      setSuccessMessage("If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).");
      return;
    }

    const message = FIREBASE_ERROR_MESSAGES[err.code as string] || `An unexpected error occurred: ${err.message} (Code: ${err.code})`;
    setError(message);
    console.error("Firebase Auth Error:", err.code, err.message);

  }, [setError, setSuccessMessage, clearAuthMessages]);


  const signInWithGoogle = async () => {
    setGoogleSignInLoading(true);
    clearAuthMessages();
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      handleAuthSuccess("Signed in with Google successfully! Redirecting...");
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setGoogleSignInLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<boolean> => {
    setSignupLoading(true);
    clearAuthMessages();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await firebaseUpdateProfile(userCredential.user, { displayName });
        await sendEmailVerification(userCredential.user);

        const parsedUser = parseFirebaseUser(userCredential.user);
        setUser(parsedUser);
        setIsEmailVerified(userCredential.user.emailVerified);
      }
      // For signup, skip redirect and let the login page handle UI.
      handleAuthSuccess(undefined, { fromSignup: true, skipRedirect: true }); 
      return true;
    } catch (err: any) {
      handleAuthError(err, 'signup');
      return false;
    } finally {
      setSignupLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoginLoading(true);
    clearAuthMessages();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      handleAuthSuccess("Signed in successfully! Redirecting...");
    } catch (err: any) { 
      handleAuthError(err);
    } finally {
      setLoginLoading(false);
    }
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    setPasswordResetLoading(true);
    clearAuthMessages(); 
    try {
      await sendPasswordResetEmail(auth, email);
      setError(null); // Explicitly clear error before setting success
      handleAuthError({ code: 'auth/user-not-found' }, 'passwordReset'); // Triggers generic success
      return true;
    } catch (err: any) {
      handleAuthError(err, 'passwordReset'); 
      return false;
    } finally {
      setPasswordResetLoading(false);
    }
  };
  
  const resendEmailVerification = async () => {
    if (!auth.currentUser) {
      setError("No user is currently signed in to resend verification email.");
      return;
    }
    if (auth.currentUser.emailVerified) {
      setSuccessMessage("Your email is already verified!");
      return;
    }

    setVerificationResendLoading(true);
    clearAuthMessages();
    try {
      await sendEmailVerification(auth.currentUser);
      setSuccessMessage("Verification email resent! Please check your inbox (and spam folder).");
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setVerificationResendLoading(false);
    }
  };


  const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    setProfileUpdateLoading(true);
    clearAuthMessages();
    if (!auth.currentUser) {
      setError("No user logged in to update profile.");
      setProfileUpdateLoading(false);
      return;
    }
    try {
      await firebaseUpdateProfile(auth.currentUser, updates);
      const parsedUser = parseFirebaseUser(auth.currentUser); // Re-parse after update
      setUser(parsedUser);
      if (auth.currentUser) setIsEmailVerified(auth.currentUser.emailVerified); // Update email verified status
      setSuccessMessage("Profile updated successfully!");
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  const logout = async () => {
    // Use a general loading state or a specific one if preferred for logout
    setGoogleSignInLoading(true); // Re-using google sign-in for simplicity, can be specific
    clearAuthMessages();
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsEmailVerified(undefined);
      router.push('/login'); // Redirect to login after logout
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setGoogleSignInLoading(false);
    }
  };

  const value = useMemo(() => ({
    user,
    isEmailVerified,
    loginLoading,
    signupLoading,
    passwordResetLoading,
    profileUpdateLoading,
    verificationResendLoading,
    googleSignInLoading,
    error,
    successMessage,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    sendPasswordReset,
    updateUserProfile,
    logout,
    resendEmailVerification,
    clearAuthMessages,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    user, isEmailVerified,
    loginLoading, signupLoading, passwordResetLoading, profileUpdateLoading, verificationResendLoading, googleSignInLoading,
    error, successMessage,
    // router, pathname, // router and pathname are stable from Next.js hooks
    // Memoizing functions if they don't depend on frequently changing state from outside
    // For simplicity here, assuming they are stable or their dependencies are listed
  ]);

  if (initialAuthLoading) {
    // You could return a full-page loader here if desired
    return <div className="flex min-h-screen items-center justify-center bg-background"><p>Authenticating...</p></div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

