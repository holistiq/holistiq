import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Share2,
  Copy,
  Eye,
  Clock,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  getUserPublicShares,
  revokePublicShare,
  generateShareableUrl,
  UserPublicShare,
} from "@/services/publicShareService";
import { formatDistanceToNow } from "date-fns";

/**
 * Component for managing user's public shares
 */
export function PublicShareManager() {
  const [shares, setShares] = useState<UserPublicShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShares();
  }, []);

  const loadShares = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getUserPublicShares();

      if (response.success && response.data) {
        setShares(response.data);
      } else {
        setError(response.error || "Failed to load shares");
      }
    } catch (err) {
      console.error("Error loading shares:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (shareToken: string) => {
    try {
      const url = generateShareableUrl(shareToken);
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to your clipboard.",
      });
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleRevokeShare = async (shareToken: string) => {
    try {
      const response = await revokePublicShare(shareToken);

      if (response.success) {
        toast({
          title: "Share revoked",
          description: "The share link has been deactivated.",
        });
        // Reload shares to reflect the change
        loadShares();
      } else {
        toast({
          title: "Failed to revoke share",
          description: response.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to revoke share:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const formatTestType = (testType: string): string => {
    switch (testType) {
      case "n-back-2":
        return "N-Back Test";
      case "reaction-time":
        return "Reaction Time Test";
      default:
        return testType
          .replace(/-/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const getShareStatus = (share: PublicShare) => {
    if (!share.is_active) {
      return { status: "revoked", color: "bg-red-100 text-red-800" };
    }

    if (share.expires_at && new Date(share.expires_at) <= new Date()) {
      return { status: "expired", color: "bg-orange-100 text-orange-800" };
    }

    if (share.max_views && share.current_views >= share.max_views) {
      return {
        status: "limit reached",
        color: "bg-orange-100 text-orange-800",
      };
    }

    return { status: "active", color: "bg-green-100 text-green-800" };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Shared Test Results</CardTitle>
          <CardDescription>
            Manage your publicly shared test results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Shared Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={loadShares} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Your Shared Test Results
        </CardTitle>
        <CardDescription>
          Manage your publicly shared test results and view sharing statistics
        </CardDescription>
      </CardHeader>

      <CardContent>
        {shares.length === 0 ? (
          <div className="text-center py-8">
            <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No shared results yet
            </h3>
            <p className="text-muted-foreground">
              Create shareable links for your test results to share with friends
              and family.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Result</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shares.map((share) => {
                  const shareStatus = getShareStatus(share);

                  return (
                    <TableRow key={share.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {share.title ??
                              `${formatTestType(share.test_results.test_type)} Result`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Score: {share.test_results.score} •{" "}
                            {formatDistanceToNow(
                              new Date(share.test_results.timestamp),
                              { addSuffix: true },
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {share.current_views}
                            {share.max_views ? ` / ${share.max_views}` : ""}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge className={shareStatus.color}>
                          {shareStatus.status}
                        </Badge>
                        {share.expires_at &&
                          shareStatus.status === "active" && (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires{" "}
                              {formatDistanceToNow(new Date(share.expires_at), {
                                addSuffix: true,
                              })}
                            </div>
                          )}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(share.created_at), {
                            addSuffix: true,
                          })}
                        </div>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleCopyLink(share.share_token)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(
                                  generateShareableUrl(share.share_token),
                                  "_blank",
                                )
                              }
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Share
                            </DropdownMenuItem>
                            {share.is_active && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRevokeShare(share.share_token)
                                }
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Revoke Share
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
