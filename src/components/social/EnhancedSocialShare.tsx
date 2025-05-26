import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Share2,
  Link as LinkIcon,
  Copy,
  Settings,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
} from "lucide-react";
import { SocialShare } from "./SocialShare";
import {
  createPublicShare,
  generateShareableUrl,
  CreatePublicShareRequest,
} from "@/services/publicShareService";

interface EnhancedSocialShareProps {
  testId: string;
  testType: string;
  score: number;
  title: string;
  text: string;
  hashtags?: string[];
  onShare?: (platform: string) => void;
}

/**
 * Enhanced social sharing component with public link generation
 */
export function EnhancedSocialShare({
  testId,
  testType,
  score,
  title,
  text,
  hashtags = [],
  onShare,
}: EnhancedSocialShareProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    customTitle: "",
    description: "",
    expiresInHours: "",
    maxViews: "",
    enableExpiration: false,
    enableViewLimit: false,
  });

  const handleCreatePublicShare = async () => {
    setIsCreatingShare(true);

    try {
      const request: CreatePublicShareRequest = {
        testId,
        title:
          shareSettings.customTitle || `${testType} Result - Score: ${score}`,
        description: shareSettings.description || undefined,
        expiresInHours:
          shareSettings.enableExpiration && shareSettings.expiresInHours
            ? parseInt(shareSettings.expiresInHours)
            : undefined,
        maxViews:
          shareSettings.enableViewLimit && shareSettings.maxViews
            ? parseInt(shareSettings.maxViews)
            : undefined,
      };

      const response = await createPublicShare(request);

      if (response.success && response.data) {
        const fullUrl = generateShareableUrl(response.data.shareToken);
        setShareUrl(fullUrl);

        toast({
          title: "Share link created!",
          description: "Your test result can now be shared with friends.",
        });
      } else {
        toast({
          title: "Failed to create share link",
          description: response.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating public share:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleSocialShare = (platform: string) => {
    const urlToShare = shareUrl || window.location.href;

    // Update the social share component to use the public share URL if available
    const shareText = shareUrl
      ? `${text} Check out my detailed results: ${shareUrl}`
      : text;

    if (onShare) {
      onShare(platform);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Social Share */}
      <div>
        <h3 className="text-sm font-medium mb-2">Quick Share</h3>
        <SocialShare
          title={title}
          text={text}
          url={shareUrl || window.location.href}
          hashtags={hashtags}
          onShare={handleSocialShare}
          variant="outline"
          size="sm"
        />
      </div>

      {/* Create Shareable Link */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Create Shareable Link
          </CardTitle>
          <CardDescription>
            Generate a secure link that friends can view without signing up
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!shareUrl ? (
            <>
              {/* Basic Settings */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="customTitle">Custom Title (Optional)</Label>
                  <Input
                    id="customTitle"
                    placeholder={`${testType} Result - Score: ${score}`}
                    value={shareSettings.customTitle}
                    onChange={(e) =>
                      setShareSettings((prev) => ({
                        ...prev,
                        customTitle: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add a personal message about your test results..."
                    value={shareSettings.description}
                    onChange={(e) =>
                      setShareSettings((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="mb-3"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Advanced Settings
                </Button>

                {showAdvanced && (
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    {/* Expiration */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">
                          Link Expiration
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically expire the link after a set time
                        </p>
                      </div>
                      <Switch
                        checked={shareSettings.enableExpiration}
                        onCheckedChange={(checked) =>
                          setShareSettings((prev) => ({
                            ...prev,
                            enableExpiration: checked,
                          }))
                        }
                      />
                    </div>

                    {shareSettings.enableExpiration && (
                      <div>
                        <Label htmlFor="expiresIn">Expires in (hours)</Label>
                        <Select
                          value={shareSettings.expiresInHours}
                          onValueChange={(value) =>
                            setShareSettings((prev) => ({
                              ...prev,
                              expiresInHours: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 hour</SelectItem>
                            <SelectItem value="24">24 hours</SelectItem>
                            <SelectItem value="168">1 week</SelectItem>
                            <SelectItem value="720">1 month</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* View Limit */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">
                          View Limit
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Limit how many times the link can be viewed
                        </p>
                      </div>
                      <Switch
                        checked={shareSettings.enableViewLimit}
                        onCheckedChange={(checked) =>
                          setShareSettings((prev) => ({
                            ...prev,
                            enableViewLimit: checked,
                          }))
                        }
                      />
                    </div>

                    {shareSettings.enableViewLimit && (
                      <div>
                        <Label htmlFor="maxViews">Maximum views</Label>
                        <Select
                          value={shareSettings.maxViews}
                          onValueChange={(value) =>
                            setShareSettings((prev) => ({
                              ...prev,
                              maxViews: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select limit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 views</SelectItem>
                            <SelectItem value="10">10 views</SelectItem>
                            <SelectItem value="25">25 views</SelectItem>
                            <SelectItem value="100">100 views</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                onClick={handleCreatePublicShare}
                disabled={isCreatingShare}
                className="w-full"
              >
                {isCreatingShare ? (
                  <>Creating Link...</>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Create Shareable Link
                  </>
                )}
              </Button>
            </>
          ) : (
            /* Share URL Created */
            <div className="space-y-3">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Your shareable link has been created! Friends can view your
                  test results without signing up.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyShareUrl}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2 text-xs text-muted-foreground">
                {shareSettings.enableExpiration &&
                  shareSettings.expiresInHours && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      Expires in {shareSettings.expiresInHours}h
                    </Badge>
                  )}
                {shareSettings.enableViewLimit && shareSettings.maxViews && (
                  <Badge variant="outline" className="text-xs">
                    <Eye className="mr-1 h-3 w-3" />
                    Max {shareSettings.maxViews} views
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
