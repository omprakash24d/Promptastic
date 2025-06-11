
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { AuthUser } from '@/types';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase/config';
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
  updateProfile as firebaseUpdateProfile, // Added updateProfile
  // RecaptchaVerifier
} from 'firebase/auth';


interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithPhoneNumber: (phoneNumber: string, appVerifier: any) => Promise<any>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>; // Added displayName
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>; // New function
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
    router.push('/'); // Redirect to home on successful auth actions like sign-in/sign-up
    setError(null);
    if (message) setSuccessMessage(message);
    else setSuccessMessage(null); // Clear if no specific message
  }

  const handleAuthError = (err: any) => {
    console.error("Auth Error:", err);
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
          setError('Sign-in popup was closed before completing. Please try again.');
          break;
        case 'auth/cancelled-popup-request':
          setError('Sign-in process was cancelled. Please try again.');
           break;
        case 'auth/account-exists-with-different-credential':
          setError('An account already exists with this email, but with a different sign-in method (e.g., Google, GitHub). Try signing in with that method.');
          break;
        case 'auth/invalid-email':
          setError('The email address is not valid.');
          break;
        default:
          setError(err.message || 'An unexpected error occurred.');
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

  const signInWithPhoneNumber = async (phoneNumber: string, appVerifier: any) => {
    setLoading(true);
    clearAuthMessages();
    console.log("Attempting Phone Sign-In (Placeholder) for:", phoneNumber);
    alert("Phone Sign-In: Advanced setup required (RecaptchaVerifier & OTP UI). This is a placeholder.");
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
        // Update local state if onAuthStateChanged hasn't fired yet or to ensure immediate reflection
        setUser(prev => ({
            ...prev,
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: displayName, // Use the provided displayName
            photoURL: userCredential.user.photoURL
        }));
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
      // Update local user state to reflect changes immediately
      setUser(prevUser => {
        if (!prevUser) return null;
        // Create a new object for the updated user to ensure reactivity
        const updatedUser = { ...prevUser };
        if (updates.displayName !== undefined) {
          updatedUser.displayName = updates.displayName;
        }
        if (updates.photoURL !== undefined) { // Though photoURL update is placeholder for now
          updatedUser.photoURL = updates.photoURL;
        }
        return updatedUser;
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
    updateUserProfile, // Added updateUserProfile
    logout,
    clearAuthMessages,
  }), [user, loading, error, successMessage, router]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
