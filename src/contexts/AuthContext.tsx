
"use client";

import type React from 'react';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { AuthUser } from '@/types';
import { useRouter } from 'next/navigation';
// import { auth } from '@/firebase/config'; // User will uncomment and implement this
// import { 
//   onAuthStateChanged, 
//   GoogleAuthProvider, 
//   GithubAuthProvider,
//   PhoneAuthProvider, 
//   signInWithPopup, 
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   sendPasswordResetEmail,
//   signOut as firebaseSignOut,
//   // RecaptchaVerifier // For phone auth
// } from 'firebase/auth';


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

  // Placeholder: Replace with real onAuthStateChanged listener
  useEffect(() => {
    // const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
    //   if (firebaseUser) {
    //     const { uid, email, displayName, phoneNumber, photoURL } = firebaseUser;
    //     setUser({ uid, email, displayName, phoneNumber, photoURL });
    //   } else {
    //     setUser(null);
    //   }
    //   setLoading(false);
    // });
    // return () => unsubscribe();
    
    // Mock implementation:
    setLoading(false); // Simulate loading finished
    // To test logged-in state, you can uncomment the following:
    // setUser({ uid: 'mock-uid', email: 'test@example.com', displayName: 'Mock User' });
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    console.log("Attempting Google Sign-In (Placeholder)");
    // Placeholder: Implement Firebase Google Sign-In
    // try {
    //   const provider = new GoogleAuthProvider();
    //   await signInWithPopup(auth, provider);
    //   router.push('/'); // Redirect after login
    // } catch (err) {
    //   setError(err.message);
    // } finally {
    //   setLoading(false);
    // }
    alert("Google Sign-In: Not implemented. See console.");
    setLoading(false);
  };

  const signInWithGithub = async () => {
    setLoading(true);
    setError(null);
    console.log("Attempting GitHub Sign-In (Placeholder)");
    // Placeholder: Implement Firebase GitHub Sign-In
    alert("GitHub Sign-In: Not implemented. See console.");
    setLoading(false);
  };
  
  const signInWithPhoneNumber = async (phoneNumber: string, appVerifier: any) => {
    setLoading(true);
    setError(null);
    console.log("Attempting Phone Sign-In (Placeholder) for:", phoneNumber);
    // Placeholder: Implement Firebase Phone Sign-In
    // try {
    //   const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    //   // Store confirmationResult to use later (e.g., in a separate component/state for OTP input)
    //   return confirmationResult; 
    // } catch (err) {
    //   setError(err.message);
    //   setLoading(false);
    //   throw err;
    // }
    alert("Phone Sign-In: Not implemented. See console.");
    setLoading(false);
    return Promise.resolve({ verify: async (code: string) => { alert('OTP Verification: Not implemented'); }}); // Mock confirmationResult
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    console.log("Attempting Email Sign-Up (Placeholder) for:", email);
    // Placeholder: Implement Firebase Email/Password Sign-Up
    // try {
    //   await createUserWithEmailAndPassword(auth, email, password);
    //   router.push('/'); // Redirect after signup
    // } catch (err) {
    //   setError(err.message);
    // } finally {
    //   setLoading(false);
    // }
    alert("Email Sign-Up: Not implemented. See console.");
    setLoading(false);
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    console.log("Attempting Email Sign-In (Placeholder) for:", email);
    // Placeholder: Implement Firebase Email/Password Sign-In
    // try {
    //   await signInWithEmailAndPassword(auth, email, password);
    //   router.push('/'); // Redirect after login
    // } catch (err) {
    //   setError(err.message);
    // } finally {
    //   setLoading(false);
    // }
    alert("Email Sign-In: Not implemented. See console.");
    setLoading(false);
  };

  const sendPasswordReset = async (email: string) => {
    setLoading(true);
    setError(null);
    console.log("Attempting Password Reset (Placeholder) for:", email);
    // Placeholder: Implement Firebase Password Reset
    // try {
    //   await sendPasswordResetEmail(auth, email);
    //   alert("Password reset email sent! Check your inbox.");
    // } catch (err) {
    //   setError(err.message);
    // } finally {
    //   setLoading(false);
    // }
    alert("Password Reset: Not implemented. See console.");
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    console.log("Attempting Logout (Placeholder)");
    // Placeholder: Implement Firebase Sign Out
    // try {
    //   await firebaseSignOut(auth);
    //   setUser(null); // Clear user from context
    //   router.push('/login'); // Redirect to login
    // } catch (err) {
    //   setError(err.message);
    // } finally {
    //   setLoading(false);
    // }
    setUser(null); // Mock logout
    alert("Logout: Successful (mock). See console.");
    router.push('/login');
    setLoading(false);
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
  }), [user, loading, error, router]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
