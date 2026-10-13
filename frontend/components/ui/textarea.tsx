import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-32 w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground  transition-all duration-200 outline-none placeholder:text-muted-foreground hover:border-muted-foreground/60 hover:bg-background focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-70 aria-invalid:border-red-300/70 aria-invalid:ring-4 aria-invalid:ring-red-500/15",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
