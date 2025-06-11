
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
  PhoneAuthProvider, // Keep for future, though implementation is complex
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  // RecaptchaVerifier // Needed for phone auth
} from 'firebase/auth';


interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithPhoneNumber: (phoneNumber: string, appVerifier: any) => Promise<any>; 
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
    router.push('/'); // Redirect to home page on successful auth
    setError(null);
    if (message) setSuccessMessage(message);
    else setSuccessMessage(null); // Clear any previous success if no new one
  }

  const handleAuthError = (err: any) => {
    setSuccessMessage(null); // Clear any success messages on error
    const userCancellableErrors = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

    if (err.code && userCancellableErrors.includes(err.code)) {
      // For user-cancellable errors, set the error message but don't log to console
      // and ensure loading is false.
      if (err.code === 'auth/popup-closed-by-user') {
        setError('The sign-in popup was closed before the process could finish. If you\'d like to sign in, please try again.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('The sign-in attempt was cancelled. If you\'d like to sign in, please try again.');
      }
      setLoading(false); // Explicitly set loading to false here for these cases
      return; // Stop further processing for these specific errors
    }

    // For other errors, log them and set the message
    console.error("Auth Error:", err);

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
        case 'auth/account-exists-with-different-credential':
          setError('An account already exists with this email, but with a different sign-in method (e.g., Google, GitHub). Try signing in with that method.');
          break;
        case 'auth/invalid-email':
          setError('The email address is not valid.');
          break;
        case 'auth/unauthorized-domain':
             setError('This domain is not authorized for Firebase operations. Please check your Firebase project configuration (Authentication > Sign-in method > Authorized domains) or contact support.');
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
    } catch (err: any) {
      console.error("Google Sign-In Raw Error:", err); 
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
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithPhoneNumber = async (phoneNumber: string, appVerifier: any): Promise<any> => {
    setLoading(true);
    clearAuthMessages();
    console.warn("Phone Sign-In: Advanced setup required (RecaptchaVerifier & OTP UI). This is a placeholder.");
    // Placeholder: In a real scenario, you would integrate RecaptchaVerifier here
    // and then call Firebase's signInWithPhoneNumber.
    // For now, simulate an error or do nothing.
    try {
        // Example: const confirmationResult = await firebaseSignInWithPhoneNumber(auth, phoneNumber, appVerifier);
        // return confirmationResult; 
        alert("Phone Sign-In: Placeholder. Not implemented in this step. See AuthContext.tsx for guidance.");
        throw new Error("Phone sign-in not fully implemented.");
    } catch (err: any) {
        handleAuthError(err);
        return Promise.reject(err); // Ensure a promise is returned in error case too
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
        // Update local user state to reflect displayName immediately
        // onAuthStateChanged will also pick this up, but this provides faster UI update
        setUser(prev => {
            if (!userCredential.user) return null; 
            return {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: displayName, // Use the displayName passed to the function
                photoURL: userCredential.user.photoURL, // This will be null initially
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

  const sendPasswordReset = async (email: string) => {
    setLoading(true);
    clearAuthMessages();
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset email sent! Check your inbox (and spam folder).");
      setError(null); // Clear any previous error
    } catch (err: any) {
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
      // onAuthStateChanged will also pick this up, but this can be faster for UI
      setUser(prevUser => {
        if (!prevUser || !auth.currentUser) return null; // Should not happen if currentUser check passed
        const updatedFirebaseUser = auth.currentUser; // Get the fresh user object
        return {
            ...prevUser,
            displayName: updatedFirebaseUser.displayName, // Firebase's displayName
            photoURL: updatedFirebaseUser.photoURL, // Firebase's photoURL
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
      setUser(null); // Explicitly set user to null
      router.push('/login'); // Redirect to login page after logout
    } catch (err: any) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  // useMemo to prevent context value from changing on every render
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
  }), [user, loading, error, successMessage]); // Add all dependencies that trigger re-creation

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

