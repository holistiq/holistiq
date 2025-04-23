
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col md:flex-row items-center justify-between p-4 md:py-6 md:px-6 gap-4 text-sm">
        <div className="flex items-center gap-4">
          <Link to="/terms" className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
            Terms of Service
          </Link>
          <Link to="/privacy" className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          <Link to="/disclaimer" className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
            Disclaimer
          </Link>
        </div>
        <div className="text-muted-foreground">
          &copy; {new Date().getFullYear()} Holistiq. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
