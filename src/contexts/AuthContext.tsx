
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
  PhoneAuthProvider, // Keep for potential future use
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
    console.error("Auth Error:", err); // Keep console log for debugging
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
          setError('The sign-in attempt was cancelled, possibly by opening another sign-in popup. Please try again.');
           break;
        case 'auth/account-exists-with-different-credential':
          setError('An account already exists with this email, but with a different sign-in method (e.g., Google, GitHub). Try signing in with that method.');
          break;
        case 'auth/invalid-email':
          setError('The email address is not valid.');
          break;
        case 'auth/unauthorized-domain':
             setError('This domain is not authorized for Firebase operations. Please contact support or check your Firebase project configuration.');
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
    // Actual implementation would be:
    // try {
    //   const confirmationResult = await firebaseSignInWithPhoneNumber(auth, phoneNumber, appVerifier);
    //   setSuccessMessage("OTP sent to your phone.");
    //   return confirmationResult; // This object has a .confirm(code) method
    // } catch (err) {
    //   handleAuthError(err);
    //   throw err; // Re-throw to be caught by UI if needed
    // } finally {
    //   setLoading(false);
    // }
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
        // Update local state to reflect displayName immediately
        setUser(prev => {
            if (!userCredential.user) return null; // Should not happen if createUserWithEmailAndPassword succeeded
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
      setError(null); // Explicitly clear error on success here
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
        if (!prevUser) return null;
        const updatedUser = { ...prevUser };
        if (updates.displayName !== undefined) {
          updatedUser.displayName = updates.displayName;
        }
        if (updates.photoURL !== undefined) {
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
      setUser(null); // Ensure local user state is cleared
      router.push('/login'); // Redirect to login page
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // useMemo to prevent unnecessary re-renders of consumers
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
  }), [user, loading, error, successMessage, router]); // router is stable, added just in case

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
