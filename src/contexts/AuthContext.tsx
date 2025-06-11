
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
  PhoneAuthProvider, // Keep for potential future use
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  // RecaptchaVerifier // For phone auth, to be implemented by user
} from 'firebase/auth';


interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithPhoneNumber: (phoneNumber: string, appVerifier: any) => Promise<any>; // appVerifier will be RecaptchaVerifier
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const handleAuthSuccess = () => {
    router.push('/');
    setError(null);
  }

  const handleAuthError = (err: any) => {
    console.error("Auth Error:", err);
    // Firebase errors often have a 'code' and 'message' property
    if (err.code && err.message) {
      // Basic formatting for common errors
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Invalid email or password.');
          break;
        case 'auth/email-already-in-use':
          setError('This email address is already in use.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. It should be at least 6 characters.');
          break;
        case 'auth/requires-recent-login':
          setError('This action requires a recent login. Please sign out and sign in again.');
          break;
        case 'auth/popup-closed-by-user':
          setError('Sign-in popup closed by user. Please try again.');
          break;
        case 'auth/cancelled-popup-request':
          setError('Multiple sign-in popups opened. Please complete one or try again.');
           break;
        case 'auth/account-exists-with-different-credential':
          setError('An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.');
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
    setError(null);
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
    setError(null);
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
    // This is a more complex flow requiring RecaptchaVerifier and OTP input UI
    // User will need to implement this fully.
    setLoading(true);
    setError(null);
    console.log("Attempting Phone Sign-In (Placeholder) for:", phoneNumber);
    alert("Phone Sign-In: Advanced setup required (RecaptchaVerifier & OTP UI). This is a placeholder.");
    // try {
    //   const confirmationResult = await firebaseSignInWithPhoneNumber(auth, phoneNumber, appVerifier);
    //   // Store confirmationResult to use later (e.g., in a separate component/state for OTP input)
    //   setLoading(false);
    //   return confirmationResult; 
    // } catch (err) {
    //   handleAuthError(err);
    //   setLoading(false);
    //   throw err;
    // }
    setLoading(false);
    return Promise.resolve({ verify: async (code: string) => { alert('OTP Verification: Placeholder. Not implemented'); }}); // Mock confirmationResult
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      handleAuthSuccess();
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
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
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent! Check your inbox.");
      setError(null); // Clear previous errors
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
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
    signInWithGoogle,
    signInWithGithub,
    signInWithPhoneNumber,
    signUpWithEmail,
    signInWithEmail,
    sendPasswordReset,
    logout,
  }), [user, loading, error, router]); // Added router to dependency array for handleAuthSuccess

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
