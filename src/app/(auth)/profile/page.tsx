
"use client";

import type React from 'react';
// import type { Metadata } from 'next'; // Metadata export is for Server Components
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, UserCircle2, Camera, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// For Client Components, metadata is typically handled by the RootLayout or a parent Server Component.
// The title will be "Promptastic! - Modern Teleprompter & Script Tool" by default from layout.tsx
// export const metadata: Metadata = {
//   title: 'User Profile',
//   description: 'Manage your Promptastic! user profile. Update your display name and profile picture.',
// };

export default function ProfilePage() {
  const { user, updateUserProfile, profileUpdateLoading, error, successMessage, clearAuthMessages } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!user && !profileUpdateLoading && !error) { 
      router.push('/login');
    }
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoPreview(user.photoURL || null);
    }
    return () => {
      clearAuthMessages();
      setLocalError(null);
    };
  }, [user, profileUpdateLoading, router, clearAuthMessages, error]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearAuthMessages();
    setLocalError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const MAX_FILE_SIZE_MB = 5;
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setLocalError(`File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
        setPhotoFile(null);
        setPhotoPreview(user?.photoURL || null); 
        e.target.value = ""; 
        return;
      }
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!ALLOWED_TYPES.includes(file.type)) {
        setLocalError('Invalid file type. Please upload a JPG, PNG, GIF, or WEBP image.');
        setPhotoFile(null);
        setPhotoPreview(user?.photoURL || null); 
        e.target.value = ""; 
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoFile(null);
      setPhotoPreview(user?.photoURL || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthMessages();
    setLocalError(null);

    if (!user) {
      setLocalError("User not found. Please log in.");
      return;
    }

    const updates: { displayName?: string } = {};
    let hasChanges = false;

    if (displayName.trim() !== (user.displayName || '')) {
      updates.displayName = displayName.trim();
      hasChanges = true;
    }
    
    if (photoFile) {
        hasChanges = true;
    }


    if (hasChanges) {
      // @ts-ignore // TODO: Fix this type error in AuthContext updateUserProfile if possible
      await updateUserProfile(updates, photoFile);
      if (!error && !localError) { 
        setPhotoFile(null); 
      }
    } else {
        // TODO: Figure out how to call AuthContext's setSuccessMessage here if possible or remove this
        // setSuccessMessage("No changes to save.");
        // For now, just clear existing messages
        clearAuthMessages();
    }
  };

  if (profileUpdateLoading && !user && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Please <Link href="/login" className="underline hover:text-primary">login</Link> to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
           <div className="relative mx-auto mb-4">
            <Avatar className="h-24 w-24 text-6xl">
              <AvatarImage src={photoPreview || undefined} alt={user.displayName || 'User'} />
              <AvatarFallback>
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserCircle2 />}
              </AvatarFallback>
            </Avatar>
            <Button
                variant="outline"
                size="icon"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-background"
                onClick={() => document.getElementById('photoUpload')?.click()}
                title="Change profile picture"
                disabled={profileUpdateLoading}
                aria-label="Change profile picture"
            >
                <Camera className="h-4 w-4" />
            </Button>
            <Input
                id="photoUpload"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleFileChange}
                disabled={profileUpdateLoading}
                aria-label="Profile photo upload input"
            />
          </div>
          <CardTitle className="text-2xl">Edit Profile</CardTitle>
          <CardDescription>Update your display name and profile picture.</CardDescription>
        </CardHeader>
        <CardContent>
          {localError && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive">
              <AlertCircle className="mr-2 inline h-4 w-4" /> {localError}
            </div>
          )}
          {error && !localError && ( 
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive">
              <AlertCircle className="mr-2 inline h-4 w-4" /> {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 rounded-md border border-green-500/50 bg-green-500/10 p-3 text-center text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="mr-2 inline h-4 w-4" /> {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email-display" className="text-sm text-muted-foreground">Email Address</Label>
              <Input
                id="email-display"
                type="email"
                value={user.email || ''}
                readOnly
                disabled
                className="mt-1 bg-muted/50 cursor-not-allowed"
              />
               <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed.</p>
            </div>
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => {
                    setDisplayName(e.target.value);
                    clearAuthMessages();
                    setLocalError(null);
                }}
                placeholder="Your Name"
                className="mt-1"
                disabled={profileUpdateLoading}
              />
            </div>
            {photoFile && <p className="text-xs text-muted-foreground">New photo selected: {photoFile.name}.</p>}
            <Button type="submit" className="w-full" disabled={profileUpdateLoading || (!displayName.trim() && !photoFile && displayName === (user.displayName || ''))}>
              {profileUpdateLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {profileUpdateLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pt-6">
          <p className="text-center text-xs text-muted-foreground">
            Back to <Link href="/" className="underline hover:text-primary">Promptastic!</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
