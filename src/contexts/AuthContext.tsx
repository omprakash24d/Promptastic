
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { AuthUser } from '@/types';
import { usePathname, useRouter } from 'next/navigation';
import { auth, storage } from '@/firebase/config'; // Added storage
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
  type User as FirebaseUser,
} from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; // Added Firebase Storage imports
import { useTeleprompterStore } from '@/hooks/useTeleprompterStore';

const MESSAGE_CLEAR_TIMEOUT = 7000;

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
  'storage/unauthorized': 'You do not have permission to upload this file. Check storage security rules.',
  'storage/canceled': 'File upload was canceled.',
  'storage/unknown': 'An unknown error occurred during file upload. Please try again.',
};


interface AuthContextType {
  user: AuthUser | null;
  loginLoading: boolean;
  signupLoading: boolean;
  passwordResetLoading: boolean;
  profileUpdateLoading: boolean;
  verificationResendLoading: boolean;
  googleSignInLoading: boolean;
  error: string | null;
  successMessage: string | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  updateUserProfile: (updates: { displayName?: string }, photoFile?: File | null) => Promise<void>; // Signature updated
  logout: () => Promise<void>;
  resendEmailVerification: () => Promise<void>;
  clearAuthMessages: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseFirebaseUser = (firebaseUser: FirebaseUser | null): AuthUser | null => {
  if (!firebaseUser) return null;
  const { uid, email, displayName, phoneNumber, photoURL, emailVerified } = firebaseUser;
  return { uid, email, displayName, phoneNumber, photoURL, isEmailVerified: emailVerified };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
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
  const pathname = usePathname();
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializeUserScripts = useTeleprompterStore((state) => state.initializeUserScripts);
  const clearUserScripts = useTeleprompterStore((state) => state.clearUserScripts);
  const setCurrentUserIdInStore = useTeleprompterStore((state) => state.setCurrentUserId);

  const clearAuthMessages = useCallback(() => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setErrorState(null);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    setSuccessMessageState(null);
  }, []);

  const setError = useCallback((message: string | null) => {
    clearAuthMessages();
    setErrorState(message);
    if (message) {
      errorTimeoutRef.current = setTimeout(() => setErrorState(null), MESSAGE_CLEAR_TIMEOUT);
    }
  }, [clearAuthMessages]);

  const setSuccessMessage = useCallback((message: string | null) => {
    clearAuthMessages();
    setSuccessMessageState(message);
    if (message) {
      successTimeoutRef.current = setTimeout(() => setSuccessMessageState(null), MESSAGE_CLEAR_TIMEOUT);
    }
  }, [clearAuthMessages]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const parsedUser = parseFirebaseUser(firebaseUser);
      setUser(parsedUser);
      setCurrentUserIdInStore(parsedUser?.uid || null);
      if (parsedUser) {
        await initializeUserScripts(parsedUser.uid);
      } else {
        clearUserScripts();
      }
      setInitialAuthLoading(false);
    });
    return () => {
      unsubscribe();
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAuthSuccess = useCallback((message?: string, options: { fromSignup?: boolean, redirectTo?: string, skipRedirect?: boolean } = {}) => {
    const { fromSignup = false, redirectTo = '/', skipRedirect = false } = options;
    let finalMessage = message;
    if (fromSignup && auth.currentUser && !auth.currentUser.emailVerified) {
      finalMessage = "Account created! Please check your email to verify your account.";
    } else if (fromSignup) {
      finalMessage = message || "Account created successfully!";
    }
    setSuccessMessage(finalMessage || null);
    if (!skipRedirect && pathname !== redirectTo) {
        router.push(redirectTo);
    }
  }, [setSuccessMessage, router, pathname]);

  const handleAuthError = useCallback((err: any, operation?: 'passwordReset' | 'signup') => {
    clearAuthMessages();
    const userCancellableErrors = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
    if (err.code && userCancellableErrors.includes(err.code)) {
      return;
    }
    if (err.code === 'auth/user-not-found' && operation === 'passwordReset') {
      setSuccessMessage("If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).");
      return;
    }
    const message = FIREBASE_ERROR_MESSAGES[err.code as string] || `An unexpected error occurred: ${err.message} (Code: ${err.code})`;
    setError(message);
    console.error("Firebase Auth Error:", err.code, err.message);
  }, [setError, setSuccessMessage, clearAuthMessages]);

  const signInWithGoogle = async () => {
    clearAuthMessages();
    setGoogleSignInLoading(true);
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
    clearAuthMessages();
    setSignupLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await firebaseUpdateProfile(userCredential.user, { displayName });
        await sendEmailVerification(userCredential.user);
        const parsedUser = parseFirebaseUser(userCredential.user);
        setUser(parsedUser);
        setCurrentUserIdInStore(parsedUser?.uid || null);
      }
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
    clearAuthMessages();
    setLoginLoading(true);
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
    clearAuthMessages();
    setPasswordResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      handleAuthError({ code: 'auth/user-not-found' }, 'passwordReset');
      return true;
    } catch (err: any) {
      handleAuthError(err, 'passwordReset');
      return false;
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const resendEmailVerification = async () => {
    clearAuthMessages();
    if (!auth.currentUser) {
      setError("No user is currently signed in to resend verification email.");
      return;
    }
    if (auth.currentUser.emailVerified) {
      setSuccessMessage("Your email is already verified!");
      return;
    }
    setVerificationResendLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setSuccessMessage("Verification email resent! Please check your inbox (and spam folder).");
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setVerificationResendLoading(false);
    }
  };

  const updateUserProfile = async (updates: { displayName?: string }, photoFile?: File | null) => {
    clearAuthMessages();
    setProfileUpdateLoading(true);
    if (!auth.currentUser) {
      setError("No user logged in to update profile.");
      setProfileUpdateLoading(false);
      return;
    }
    try {
      let photoURL = auth.currentUser.photoURL; // Keep existing photoURL if no new file
      if (photoFile) {
        // Max file size (e.g., 5MB)
        const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; 
        if (photoFile.size > MAX_FILE_SIZE_BYTES) {
          throw { code: 'storage/object-too-large', message: 'File is too large. Maximum size is 5MB.' };
        }
        // Allowed file types (client-side check, storage rules for server-side)
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!ALLOWED_TYPES.includes(photoFile.type)) {
           throw { code: 'storage/invalid-file-type', message: 'Invalid file type. Please upload a JPG, PNG, GIF, or WEBP image.' };
        }

        const imageRef = storageRef(storage, `profilePictures/${auth.currentUser.uid}/${photoFile.name}`);
        const snapshot = await uploadBytes(imageRef, photoFile);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      const profileUpdates: { displayName?: string; photoURL?: string } = { ...updates };
      if (photoURL !== auth.currentUser.photoURL) { // Only include photoURL if it changed or was newly set
        profileUpdates.photoURL = photoURL;
      }
      
      // Only call firebaseUpdateProfile if there are actual changes
      if (Object.keys(profileUpdates).length > 0 || (photoFile && photoURL !== auth.currentUser.photoURL)) {
         await firebaseUpdateProfile(auth.currentUser, profileUpdates);
      }

      const parsedUser = parseFirebaseUser(auth.currentUser);
      setUser(parsedUser);
      setSuccessMessage("Profile updated successfully!");
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  const logout = async () => {
    clearAuthMessages();
    try {
      await firebaseSignOut(auth);
      if (pathname !== '/login') {
        router.push('/login');
      }
    } catch (err: any) {
      handleAuthError(err);
    }
  };

  const value = useMemo(() => ({
    user,
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
    user,
    loginLoading, signupLoading, passwordResetLoading, profileUpdateLoading, verificationResendLoading, googleSignInLoading,
    error, successMessage,
  ]);

  if (initialAuthLoading) {
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
