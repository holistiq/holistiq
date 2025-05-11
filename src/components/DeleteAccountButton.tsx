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

export function DeleteAccountButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        console.error("Error getting current user:", userError);
        throw new Error("Failed to verify user session");
      }

      const userId = userData.user.id;
      console.log("Attempting to delete user account:", userId);
      console.log("User data:", userData.user);

      // Call the RPC function to delete the account
      console.log("Calling request_account_deletion RPC function");
      const { data: rpcData, error: rpcError } = await supabase.rpc('request_account_deletion');

      console.log("RPC response:", { data: rpcData, error: rpcError });

      if (rpcError) {
        console.error("RPC error details:", {
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
          code: rpcError.code
        });

        throw new Error(`Failed to delete account: ${rpcError.message}`);
      }

      // RPC was successful
      toast({
        title: "Account deleted",
        description: "Your account and all associated data have been permanently deleted.",
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
        stack: (error as Error).stack
      });

      // Provide a more specific error message if possible
      let errorMessage = "Failed to delete account. Please try again later or contact support.";
      if ((error as Error).message.includes("permission denied")) {
        errorMessage = "Permission denied. The system doesn't have the necessary permissions to delete your account. Please contact support.";
      } else if ((error as Error).message.includes("foreign key constraint")) {
        errorMessage = "Unable to delete account due to data dependencies. Please contact support for assistance.";
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
        variant="destructive"
        onClick={() => setIsOpen(true)}
      >
        Delete Account
      </Button>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all of your data from our servers, including all test results
              and supplement logs.
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Yes, delete my account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
