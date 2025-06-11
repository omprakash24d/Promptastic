
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Facebook, Twitter, Linkedin, Mail, Link as LinkIcon, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonsProps {
  title?: string;
  url?: string;
  className?: string;
}

export function ShareButtons({ title: initialTitle, url: initialUrl, className }: ShareButtonsProps) {
  const { toast } = useToast();
  const [pageUrl, setPageUrl] = useState('');
  const [pageTitle, setPageTitle] = useState('');

  useEffect(() => {
    // Ensure this runs only on the client after mount
    setPageUrl(initialUrl || window.location.href);
    setPageTitle(initialTitle || document.title);
  }, [initialUrl, initialTitle]);

  if (!pageUrl) {
    // Render nothing or a loader until URL is available client-side
    return null;
  }

  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(pageTitle);

  const shareOptions = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: 'bg-[#1877F2] hover:bg-[#1877F2]/90 text-white',
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      className: 'bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      className: 'bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white',
    },
    {
      name: 'Email',
      icon: Mail,
      url: `mailto:?subject=${encodedTitle}&body=Check out this page: ${pageUrl}`, // Use non-encoded pageUrl for email body
      className: 'bg-muted-foreground hover:bg-muted-foreground/90 text-white',
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      toast({
        title: 'Link Copied!',
        description: 'The page URL has been copied to your clipboard.',
      });
    } catch (err) {
      console.error('Failed to copy link: ', err);
      toast({
        title: 'Error Copying Link',
        description: 'Could not copy the link to your clipboard.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold flex items-center">
        <Share2 className="mr-2 h-5 w-5 text-primary" />
        Share this Guide
      </h3>
      <div className="flex flex-wrap gap-2">
        {shareOptions.map((option) => (
          <Button
            key={option.name}
            variant="default"
            size="sm"
            className={option.className}
            onClick={() => window.open(option.url, '_blank', 'noopener,noreferrer')}
            aria-label={`Share on ${option.name}`}
          >
            <option.icon className="mr-2 h-4 w-4" />
            {option.name}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          aria-label="Copy link to clipboard"
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          Copy Link
        </Button>
      </div>
    </div>
  );
}
