
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { AuthUser } from '@/types';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/config'; // Assuming firebase config is correctly set up
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  PhoneAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  // RecaptchaVerifier // Keep for potential future use
} from 'firebase/auth';


interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithPhoneNumber: (phoneNumber: string, appVerifier: any) => Promise<any>; // Placeholder
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
  logout: () => Promise<void>;
  clearAuthMessages: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const { uid, email, displayName, phoneNumber, photoURL } = firebaseUser;
        setUser({ uid, email, displayName, phoneNumber, photoURL });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const clearAuthMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleAuthSuccess = (message?: string) => {
    router.push('/');
    setError(null);
    if (message) setSuccessMessage(message);
    else setSuccessMessage(null);
  }

  const handleAuthError = (err: any) => {
    // Don't log common user-cancellable errors to console, but still set user-facing message.
    if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
      console.error("Auth Error:", err); // Log other errors for debugging
    }
    setSuccessMessage(null);
    if (err.code && err.message) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Invalid email or password.');
          break;
        case 'auth/email-already-in-use':
          setError('This email address is already in use by another account.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. It should be at least 6 characters long.');
          break;
        case 'auth/requires-recent-login':
          setError('This action requires a recent login. Please sign out and sign in again.');
          break;
        case 'auth/popup-closed-by-user':
          setError('The sign-in popup was closed before the process could finish. If you\'d like to sign in, please try again.');
          break;
        case 'auth/cancelled-popup-request':
          setError('The sign-in attempt was cancelled. If you\'d like to sign in, please try again.');
           break;
        case 'auth/account-exists-with-different-credential':
          setError('An account already exists with this email, but with a different sign-in method (e.g., Google, GitHub). Try signing in with that method.');
          break;
        case 'auth/invalid-email':
          setError('The email address is not valid.');
          break;
        case 'auth/unauthorized-domain':
             setError('This domain is not authorized for Firebase operations. Please check your Firebase project configuration or contact support.');
             break;
        default:
          setError(`An unexpected error occurred: ${err.message} (Code: ${err.code})`);
      }
    } else {
      setError(err.message || 'An unexpected error occurred during authentication.');
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true);
    clearAuthMessages();
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      handleAuthSuccess();
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGithub = async () => {
    setLoading(true);
    clearAuthMessages();
    try {
      const provider = new GithubAuthProvider();
      await signInWithPopup(auth, provider);
      handleAuthSuccess();
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithPhoneNumber = async (phoneNumber: string, appVerifier: any): Promise<any> => {
    setLoading(true);
    clearAuthMessages();
    console.warn("Phone Sign-In: Advanced setup required (RecaptchaVerifier & OTP UI). This is a placeholder.");
    alert("Phone Sign-In: Placeholder. Not implemented.");
    setLoading(false);
    return Promise.resolve({ verify: async (code: string) => { alert('OTP Verification: Placeholder. Not implemented'); }});
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    clearAuthMessages();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await firebaseUpdateProfile(userCredential.user, { displayName });
        setUser(prev => {
            if (!userCredential.user) return null; 
            return {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: displayName,
                photoURL: userCredential.user.photoURL,
                phoneNumber: userCredential.user.phoneNumber,
            };
        });
      }
      handleAuthSuccess('Account created successfully! Redirecting...');
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    clearAuthMessages();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      handleAuthSuccess();
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    setLoading(true);
    clearAuthMessages();
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset email sent! Check your inbox (and spam folder).");
      setError(null); 
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    setLoading(true);
    clearAuthMessages();
    if (!auth.currentUser) {
      setError("No user logged in to update profile.");
      setLoading(false);
      return;
    }
    try {
      await firebaseUpdateProfile(auth.currentUser, updates);
      setUser(prevUser => {
        if (!prevUser || !auth.currentUser) return null;
        // Prefer fresh data from auth.currentUser after update if available
        const updatedFirebaseUser = auth.currentUser;
        return {
            ...prevUser,
            displayName: updatedFirebaseUser.displayName, // updates.displayName !== undefined ? updates.displayName : prevUser.displayName,
            photoURL: updatedFirebaseUser.photoURL, // updates.photoURL !== undefined ? updates.photoURL : prevUser.photoURL,
        };
      });
      setSuccessMessage("Profile updated successfully!");
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    clearAuthMessages();
    try {
      await firebaseSignOut(auth);
      setUser(null); 
      router.push('/login'); 
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    error,
    successMessage,
    signInWithGoogle,
    signInWithGithub,
    signInWithPhoneNumber,
    signUpWithEmail,
    signInWithEmail,
    sendPasswordReset,
    updateUserProfile,
    logout,
    clearAuthMessages,
  }), [user, loading, error, successMessage]); 

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

