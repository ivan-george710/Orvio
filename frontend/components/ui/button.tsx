import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-transparent bg-clip-padding text-sm font-bold whitespace-nowrap shadow-lg transition-all duration-300 ease-out outline-none select-none before:absolute before:inset-0 before:-translate-x-full before:bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.32),transparent)] before:transition-transform before:duration-700 hover:-translate-y-0.5 hover:scale-[1.02] hover:before:translate-x-full active:not-aria-[haspopup]:translate-y-px active:scale-[0.98] disabled:pointer-events-none disabled:translate-y-0 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/25 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/25 [&>*]:relative [&>*]:z-10 [&_svg]:pointer-events-none [&_svg]:relative [&_svg]:z-10 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[linear-gradient(135deg,#7c3aed,#8b5cf6_45%,#3b82f6)] text-white shadow-violet-500/25 hover:shadow-2xl hover:shadow-violet-500/35",
        outline:
          "border-white/10 bg-white/8 text-white shadow-black/20 backdrop-blur-xl hover:border-violet-300/40 hover:bg-violet-500/12 hover:text-white aria-expanded:bg-white/12 aria-expanded:text-white",
        secondary:
          "border-white/10 bg-[#1E293B]/80 text-white shadow-black/20 backdrop-blur-xl hover:border-blue-400/30 hover:bg-[#273449] aria-expanded:bg-[#273449] aria-expanded:text-white",
        ghost:
          "shadow-none text-slate-200 hover:bg-white/10 hover:text-white aria-expanded:bg-white/10 aria-expanded:text-white",
        destructive:
          "border-red-300/20 bg-[linear-gradient(135deg,#ef4444,#b91c1c)] text-white shadow-red-500/20 hover:shadow-2xl hover:shadow-red-500/25 focus-visible:border-red-300 focus-visible:ring-red-500/20",
        link: "shadow-none text-violet-200 underline-offset-4 hover:translate-y-0 hover:text-blue-200 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1.5 rounded-lg px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-lg px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
