/**
 * Social Share Component
 *
 * Provides buttons for sharing content on various social media platforms
 */
import { Button } from "@/components/ui/button";
import { ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Twitter, Facebook, Linkedin, Mail, Share2, Copy } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";

interface SocialShareProps extends Omit<ButtonProps, "onClick"> {
  /** Title to share */
  title: string;
  /** Text content to share */
  text: string;
  /** URL to share (defaults to current URL) */
  url?: string;
  /** Hashtags to include (without # prefix) */
  hashtags?: string[];
  /** Whether to show labels next to icons */
  showLabel?: boolean;
  /** Callback when share is completed */
  onShare?: (platform: string) => void;
}

/**
 * Component for sharing content on social media platforms
 */
export function SocialShare({
  title,
  text,
  url = window.location.href,
  hashtags = [],
  showLabel = false,
  className,
  variant = "default",
  size = "default",
  onShare,
  ...props
}: SocialShareProps) {
  const [isCopying, setIsCopying] = useState(false);

  // Format hashtags for different platforms
  const hashtagsString = hashtags.map((tag) => `#${tag}`).join(" ");
  const hashtagsParam = hashtags.join(",");

  // Handle share on Twitter/X
  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtagsParam)}`;
    window.open(twitterUrl, "_blank");
    if (onShare) onShare("twitter");
  };

  // Handle share on Facebook
  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    window.open(facebookUrl, "_blank");
    if (onShare) onShare("facebook");
  };

  // Handle share on LinkedIn
  const handleLinkedInShare = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}&title=${encodeURIComponent(title)}`;
    window.open(linkedinUrl, "_blank");
    if (onShare) onShare("linkedin");
  };

  // Handle share via email
  const handleEmailShare = () => {
    const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}\n\n${hashtagsString}`)}`;
    window.location.href = emailUrl;
    if (onShare) onShare("email");
  };

  // Handle native share if available
  const handleNativeShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title,
          text,
          url,
        })
        .then(() => {
          if (onShare) onShare("native");
        })
        .catch((error) => {
          console.error("Error sharing:", error);
        });
    } else {
      // Fallback to copy to clipboard
      handleCopyToClipboard();
    }
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = () => {
    setIsCopying(true);

    const shareText = `${text}\n\n${url}\n\n${hashtagsString}`;

    navigator.clipboard
      .writeText(shareText)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "Share text has been copied to your clipboard.",
        });
        if (onShare) onShare("clipboard");
      })
      .catch((error) => {
        console.error("Error copying to clipboard:", error);
        toast({
          title: "Failed to copy",
          description: "Could not copy to clipboard. Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsCopying(false);
      });
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {/* Twitter/X Share */}
      <Button
        variant={variant}
        size={size}
        onClick={handleTwitterShare}
        className="gap-2"
        {...props}
      >
        <Twitter className="h-4 w-4" />
        {showLabel && <span>Twitter</span>}
      </Button>

      {/* Facebook Share */}
      <Button
        variant={variant}
        size={size}
        onClick={handleFacebookShare}
        className="gap-2"
        {...props}
      >
        <Facebook className="h-4 w-4" />
        {showLabel && <span>Facebook</span>}
      </Button>

      {/* LinkedIn Share */}
      <Button
        variant={variant}
        size={size}
        onClick={handleLinkedInShare}
        className="gap-2"
        {...props}
      >
        <Linkedin className="h-4 w-4" />
        {showLabel && <span>LinkedIn</span>}
      </Button>

      {/* Email Share */}
      <Button
        variant={variant}
        size={size}
        onClick={handleEmailShare}
        className="gap-2"
        {...props}
      >
        <Mail className="h-4 w-4" />
        {showLabel && <span>Email</span>}
      </Button>

      {/* Native Share or Copy */}
      <Button
        variant={variant}
        size={size}
        onClick={navigator.share ? handleNativeShare : handleCopyToClipboard}
        className="gap-2"
        disabled={isCopying}
        {...props}
      >
        {navigator.share ? (
          <>
            <Share2 className="h-4 w-4" />
            {showLabel && <span>Share</span>}
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            {showLabel && <span>{isCopying ? "Copying..." : "Copy"}</span>}
          </>
        )}
      </Button>
    </div>
  );
}
