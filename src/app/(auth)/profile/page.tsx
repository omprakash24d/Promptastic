
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, UserCircle2, Camera, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
  const { user, updateUserProfile, loading, error, successMessage, clearAuthMessages } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login'); // Redirect if not logged in and not loading
    }
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoPreview(user.photoURL || null);
    }
    // Clear messages when component mounts
    return () => {
      clearAuthMessages();
    };
  }, [user, loading, router, clearAuthMessages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthMessages();

    if (!user) {
      // Should not happen if redirection works, but as a safeguard
      alert("User not found. Please log in.");
      return;
    }

    const updates: { displayName?: string; photoURL?: string } = {};
    if (displayName !== user.displayName) {
      updates.displayName = displayName;
    }

    // Actual photoURL update via Firebase Storage is complex and not implemented here.
    // This is a placeholder for the UI and basic logic.
    // If you were to implement it, you'd upload `photoFile` to Firebase Storage,
    // get the download URL, and then set `updates.photoURL = downloadURL;`
    if (photoFile) {
        console.warn("Profile picture update: File selected, but actual upload to Firebase Storage and photoURL update in Auth is not implemented in this step. Display name will be updated if changed.");
        // For now, we won't attempt to set photoURL from a local file preview
        // updates.photoURL = photoPreview; // This would be incorrect without actual upload
    }


    if (Object.keys(updates).length > 0) {
      await updateUserProfile(updates);
    } else if (!photoFile) {
        // No changes to display name and no new photo file selected
        // We can treat this as a "no changes made" scenario or show a specific message.
        // For now, let's just clear any previous success/error related to profile updates.
        clearAuthMessages();
    }
  };

  if (loading && !user) { // Show full page loader only if user data is not yet available
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by the redirect in useEffect,
    // but it's a fallback.
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Please <Link href="/login" className="underline">login</Link> to view your profile.</p>
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
            >
                <Camera className="h-4 w-4" />
            </Button>
            <Input
                id="photoUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
          </div>
          <CardTitle className="text-2xl">Edit Profile</CardTitle>
          <CardDescription>Update your display name and profile picture.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
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
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                required
                className="mt-1"
              />
            </div>

            {/* Profile Picture Upload Information */}
            {photoFile && <p className="text-xs text-muted-foreground">New photo selected: {photoFile.name}. Save to apply (actual upload not yet implemented).</p>}
            {!photoFile && photoPreview && <p className="text-xs text-muted-foreground">Current profile picture shown. Select a new file to change.</p>}
            {!photoFile && !photoPreview && <p className="text-xs text-muted-foreground">No profile picture set. Select a file to add one.</p>}
             <p className="text-xs text-muted-foreground mt-1">Note: Profile picture updates require Firebase Storage setup, which is not fully implemented in this step. Only display name changes will persist for now.</p>


            <Button type="submit" className="w-full" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
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
