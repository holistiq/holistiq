import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30 backdrop-blur-sm">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-nootrack-400 to-nootrack-600 dark:from-nootrack-300 dark:to-nootrack-500">
                Holistiq
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Track your cognitive performance and discover if your supplements
              are actually working with data-driven insights.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-4">
            <h3 className="font-medium mb-4 text-sm tracking-wide uppercase text-muted-foreground">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/how-it-works"
                  className="text-sm text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span>How It Works</span>
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 opacity-0 group-hover:opacity-100">
                    <ExternalLink size={12} />
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/about-us"
                  className="text-sm text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span>About Us</span>
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 opacity-0 group-hover:opacity-100">
                    <ExternalLink size={12} />
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-sm text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span>FAQ</span>
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 opacity-0 group-hover:opacity-100">
                    <ExternalLink size={12} />
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span>Contact Us</span>
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 opacity-0 group-hover:opacity-100">
                    <ExternalLink size={12} />
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="md:col-span-4">
            <h3 className="font-medium mb-4 text-sm tracking-wide uppercase text-muted-foreground">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span>Terms of Service</span>
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 opacity-0 group-hover:opacity-100">
                    <ExternalLink size={12} />
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span>Privacy Policy</span>
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 opacity-0 group-hover:opacity-100">
                    <ExternalLink size={12} />
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/disclaimer"
                  className="text-sm text-foreground/80 hover:text-primary transition-colors duration-200 flex items-center gap-1 group"
                >
                  <span>Disclaimer</span>
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 opacity-0 group-hover:opacity-100">
                    <ExternalLink size={12} />
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-border/20 py-4">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
            &copy; {new Date().getFullYear()} Holistiq. All rights reserved.
          </div>
          <div className="text-xs text-muted-foreground/70">
            Designed for optimal cognitive performance tracking
          </div>
        </div>
      </div>
    </footer>
  );
}
