import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-2xl border border-white/10 bg-[#161B22]/80 px-4 py-2 text-base text-white shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-slate-400 hover:border-violet-300/30 hover:bg-[#1E293B]/80 focus-visible:border-violet-300/60 focus-visible:ring-4 focus-visible:ring-violet-500/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-slate-500 disabled:opacity-70 aria-invalid:border-red-300/70 aria-invalid:ring-4 aria-invalid:ring-red-500/15 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
