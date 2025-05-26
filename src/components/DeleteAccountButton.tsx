import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteAccountButtonProps {
  readonly className?: string;
}

export function DeleteAccountButton({
  className = "",
}: DeleteAccountButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        console.error("Error getting current user:", userError);
        throw new Error("Failed to verify user session");
      }

      const userId = userData.user.id;
      console.log("Attempting to delete user account:", userId);
      console.log("User data:", userData.user);

      // Call the RPC function to delete the account
      console.log("Calling request_account_deletion RPC function");
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "request_account_deletion",
      );

      console.log("RPC response:", { data: rpcData, error: rpcError });

      if (rpcError) {
        console.error("RPC error details:", {
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
          code: rpcError.code,
        });

        throw new Error(`Failed to delete account: ${rpcError.message}`);
      }

      // RPC was successful
      toast({
        title: "Account deleted",
        description:
          "Your account and all associated data have been permanently deleted.",
        duration: 6000,
      });

      // Sign out the user
      await supabase.auth.signOut();

      // Redirect to home page
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      console.error("Error details:", {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack,
      });

      // Provide a more specific error message if possible
      let errorMessage =
        "Failed to delete account. Please try again later or contact support.";
      if ((error as Error).message.includes("permission denied")) {
        errorMessage =
          "Permission denied. The system doesn't have the necessary permissions to delete your account. Please contact support.";
      } else if ((error as Error).message.includes("foreign key constraint")) {
        errorMessage =
          "Unable to delete account due to data dependencies. Please contact support for assistance.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
      });

      setIsOpen(false);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={`text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 ${className}`}
      >
        Delete Account
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete your account? This action cannot
              be undone and will permanently delete all your data, including:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Your profile information</li>
                <li>All test results and history</li>
                <li>Supplement logs and tracking data</li>
                <li>Confounding factor records</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
