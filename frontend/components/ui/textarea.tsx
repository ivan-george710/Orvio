import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-32 w-full rounded-2xl border border-white/10 bg-[#161B22]/80 px-4 py-3 text-base text-white shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-300 outline-none placeholder:text-slate-400 hover:border-violet-300/30 hover:bg-[#1E293B]/80 focus-visible:border-violet-300/60 focus-visible:ring-4 focus-visible:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-500 disabled:opacity-70 aria-invalid:border-red-300/70 aria-invalid:ring-4 aria-invalid:ring-red-500/15 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
