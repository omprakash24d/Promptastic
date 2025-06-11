
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { AuthUser } from '@/types';
import { useRouter } from 'next/navigation';
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
} from 'firebase/auth';


interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<boolean>;
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

  const handleAuthError = (err: any, operation?: 'passwordReset') => {
    setSuccessMessage(null);
    const userCancellableErrors = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

    if (err.code && userCancellableErrors.includes(err.code)) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('The sign-in popup was closed before the process could finish. If you\'d like to sign in, please try again.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('The sign-in attempt was cancelled. If you\'d like to sign in, please try again.');
      }
      setLoading(false); // Ensure loading is false for these specific errors
      return; // Don't log to console
    }

    if (err.code === 'auth/user-not-found' && operation === 'passwordReset') {
      // This case is handled directly in sendPasswordReset to show a generic message
      // and prevent email enumeration. So we don't set an error here.
      return;
    }


    if (err.code && err.message) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
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
        case 'auth/account-exists-with-different-credential':
          setError('An account already exists with this email, but with a different sign-in method (e.g., Google). Try signing in with that method.');
          break;
        case 'auth/invalid-email':
          setError('The email address is not valid.');
          break;
        case 'auth/unauthorized-domain':
             setError('This domain is not authorized for Firebase operations. Please check your Firebase project configuration (Authentication > Sign-in method > Authorized domains) or contact support.');
             break;
        case 'auth/network-request-failed':
            setError('A network error occurred. Please check your internet connection and try again.');
            break;
        default:
          // console.error("Unhandled Auth Error:", err); // Suppressed for now
          setError(`An unexpected error occurred: ${err.message} (Code: ${err.code})`);
      }
    } else {
      // console.error("Generic Auth Error:", err); // Suppressed for now
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
    } catch (err: any) {
      // console.log("Google Sign-In Raw Error:", err); // For debugging specific Google sign-in issues
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
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
    } catch (err: any) {
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
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    setLoading(true);
    clearAuthMessages();
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).");
      setError(null);
      return true;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        // Prevent email enumeration: show generic success message even if user not found.
        setSuccessMessage("If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).");
        setError(null);
        // Return true so the UI (e.g., login page) behaves as if successful (starts cooldown, navigates back)
        return true;
      }
      handleAuthError(err, 'passwordReset');
      return false;
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
        const updatedFirebaseUser = auth.currentUser;
        return {
            ...prevUser,
            displayName: updatedFirebaseUser.displayName,
            photoURL: updatedFirebaseUser.photoURL,
        };
      });
      setSuccessMessage("Profile updated successfully!");
    } catch (err: any) {
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
    } catch (err: any) {
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
    signUpWithEmail,
    signInWithEmail,
    sendPasswordReset,
    updateUserProfile,
    logout,
    clearAuthMessages,
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
