
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { AuthUser } from '@/types';
import { usePathname, useRouter } from 'next/navigation';
import { auth, storage } from '@/firebase/config';
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
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  'storage/object-too-large': 'File is too large. Maximum size is 5MB.',
  'storage/invalid-file-type': 'Invalid file type. Please upload a JPG, PNG, GIF, or WEBP image.',
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
  updateUserProfile: (updates: { displayName?: string }, photoFile?: File | null) => Promise<void>;
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
  // const [initialAuthLoading, setInitialAuthLoading] = useState(true); // Removed, not directly used to block rendering
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
      errorTimeoutRef.current = setTimeout(() => { setErrorState(null); }, MESSAGE_CLEAR_TIMEOUT);
    }
  }, [clearAuthMessages]);

  const setSuccessMessageCb = useCallback((message: string | null) => {
    clearAuthMessages();
    setSuccessMessageState(message);
    if (message) {
      successTimeoutRef.current = setTimeout(() => { setSuccessMessageState(null); }, MESSAGE_CLEAR_TIMEOUT);
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
      // setInitialAuthLoading(false); // Removed
    });
    return () => {
      unsubscribe();
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencies are stable: initializeUserScripts, clearUserScripts, setCurrentUserIdInStore from Zustand are stable

  const handleAuthSuccess = useCallback((message?: string, options: { fromSignup?: boolean, redirectTo?: string, skipRedirect?: boolean } = {}) => {
    clearAuthMessages();
    const { fromSignup = false, redirectTo = '/', skipRedirect = false } = options;
    let finalMessage = message;
    if (fromSignup && auth.currentUser && !auth.currentUser.emailVerified) {
      finalMessage = "Account created! Please check your email to verify your account.";
    } else if (fromSignup) {
      finalMessage = message || "Account created successfully!";
    }
    setSuccessMessageCb(finalMessage || null);
    if (!skipRedirect && pathname !== redirectTo) {
        router.push(redirectTo);
    }
  }, [setSuccessMessageCb, router, pathname, clearAuthMessages]);

  const handleAuthError = useCallback((err: any, operation?: 'passwordReset' | 'signup') => {
    clearAuthMessages();
    const userCancellableErrors = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
    if (err.code && userCancellableErrors.includes(err.code)) {
      return; // Do not show an error for user-cancelled actions
    }
    if (err.code === 'auth/user-not-found' && operation === 'passwordReset') {
      // For password resets to non-existent emails, show a generic success message to prevent email enumeration
      setSuccessMessageCb("If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).");
      return;
    }
    const message = FIREBASE_ERROR_MESSAGES[err.code as string] || `An unexpected error occurred: ${err.message} (Code: ${err.code})`;
    setError(message);
    console.error("Firebase Auth Error:", err.code, err.message);
  }, [setError, setSuccessMessageCb, clearAuthMessages]);

  const signInWithGoogle = useCallback(async () => {
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
  }, [clearAuthMessages, handleAuthSuccess, handleAuthError]);

  const signUpWithEmail = useCallback(async (email: string, password: string, displayName: string): Promise<boolean> => {
    clearAuthMessages();
    setSignupLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await firebaseUpdateProfile(userCredential.user, { displayName });
        await sendEmailVerification(userCredential.user);
        const parsedUser = parseFirebaseUser(userCredential.user);
        setUser(parsedUser); // Update local user state immediately
        setCurrentUserIdInStore(parsedUser?.uid || null); // Update store
      }
      handleAuthSuccess(undefined, { fromSignup: true, skipRedirect: true });
      return true;
    } catch (err: any) {
      handleAuthError(err, 'signup');
      return false;
    } finally {
      setSignupLoading(false);
    }
  }, [clearAuthMessages, handleAuthSuccess, handleAuthError, setCurrentUserIdInStore]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
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
  }, [clearAuthMessages, handleAuthSuccess, handleAuthError]);

  const sendPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    clearAuthMessages();
    setPasswordResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      // The success message is handled by handleAuthError's special case for 'auth/user-not-found' during passwordReset
      handleAuthError({ code: 'auth/user-not-found' }, 'passwordReset'); 
      return true;
    } catch (err: any) {
      handleAuthError(err, 'passwordReset');
      return false;
    } finally {
      setPasswordResetLoading(false);
    }
  }, [clearAuthMessages, handleAuthError]);

  const resendEmailVerification = useCallback(async () => {
    clearAuthMessages();
    if (!auth.currentUser) {
      setError("No user is currently signed in to resend verification email.");
      return;
    }
    if (auth.currentUser.emailVerified) {
      setSuccessMessageCb("Your email is already verified!");
      return;
    }
    setVerificationResendLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setSuccessMessageCb("Verification email resent! Please check your inbox (and spam folder).");
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setVerificationResendLoading(false);
    }
  }, [clearAuthMessages, setError, setSuccessMessageCb, handleAuthError]);

  const updateUserProfile = useCallback(async (updates: { displayName?: string }, photoFile?: File | null) => {
    clearAuthMessages();
    setProfileUpdateLoading(true);
    if (!auth.currentUser) {
      setError("No user logged in to update profile.");
      setProfileUpdateLoading(false);
      return;
    }
    try {
      let photoURL = auth.currentUser.photoURL;
      if (photoFile) {
        const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
        if (photoFile.size > MAX_FILE_SIZE_BYTES) {
          throw { code: 'storage/object-too-large', message: FIREBASE_ERROR_MESSAGES['storage/object-too-large'] };
        }
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!ALLOWED_TYPES.includes(photoFile.type)) {
           throw { code: 'storage/invalid-file-type', message: FIREBASE_ERROR_MESSAGES['storage/invalid-file-type'] };
        }

        const imageRef = storageRef(storage, `profilePictures/${auth.currentUser.uid}/${photoFile.name}`);
        const snapshot = await uploadBytes(imageRef, photoFile);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      const profileUpdates: { displayName?: string; photoURL?: string | null } = {};
      if (updates.displayName !== undefined && updates.displayName !== auth.currentUser.displayName) {
        profileUpdates.displayName = updates.displayName;
      }
      if (photoURL !== auth.currentUser.photoURL) { // Check if photoURL actually changed or if it's a new upload
        profileUpdates.photoURL = photoURL;
      }

      if (Object.keys(profileUpdates).length > 0) {
         await firebaseUpdateProfile(auth.currentUser, profileUpdates);
      }

      const parsedUser = parseFirebaseUser(auth.currentUser);
      setUser(parsedUser); // Update local user state immediately
      setSuccessMessageCb("Profile updated successfully!");
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setProfileUpdateLoading(false);
    }
  }, [clearAuthMessages, setError, setSuccessMessageCb, handleAuthError]);

  const logout = useCallback(async () => {
    clearAuthMessages();
    setLoginLoading(true);
    try {
      await firebaseSignOut(auth);
      // User state will be updated by the main onAuthStateChanged listener,
      // which will also call clearUserScripts from Zustand.
      if (pathname !== '/login' && pathname !== '/') { // Avoid redundant navigation
        router.push('/login');
      }
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoginLoading(false);
    }
  }, [clearAuthMessages, handleAuthError, router, pathname]);

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
  }), [
    user,
    loginLoading, signupLoading, passwordResetLoading, profileUpdateLoading, verificationResendLoading, googleSignInLoading,
    error, successMessage,
    signInWithGoogle, signUpWithEmail, signInWithEmail, sendPasswordReset, updateUserProfile, logout, resendEmailVerification, clearAuthMessages
  ]);


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

