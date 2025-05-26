import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  author: string;
  role?: string;
  avatarUrl?: string;
  className?: string;
}

export function TestimonialCard({
  quote,
  author,
  role,
  avatarUrl,
  className,
}: Readonly<TestimonialCardProps>) {
  return (
    <div
      className={cn(
        "flex flex-col p-6 bg-background rounded-xl border shadow-sm h-full",
        className,
      )}
    >
      <div className="mb-4 text-primary">
        <Quote className="h-8 w-8 opacity-50" />
      </div>
      <blockquote className="flex-1 text-lg italic mb-4">"{quote}"</blockquote>
      <div className="flex items-center gap-3 mt-auto">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={author}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {author.charAt(0)}
          </div>
        )}
        <div>
          <div className="font-semibold">{author}</div>
          {role && <div className="text-sm text-muted-foreground">{role}</div>}
        </div>
      </div>
    </div>
  );
}
