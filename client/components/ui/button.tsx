import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * BUTTON COMPONENT - Premium Design System
 * 
 * Variants:
 * - solid: Primary action (Deep Indigo)
 * - outline: Secondary action
 * - ghost: Tertiary action
 * 
 * Interaction:
 * - Hover: subtle scale (1.01), soft glow
 * - Click: micro-shift (2px down)
 */

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-[2px]",
  {
    variants: {
      variant: {
        solid: "bg-primary text-white shadow-sm hover:bg-primary-600 hover:scale-[1.01] hover:shadow-md",
        accent: "bg-accent text-primary-900 shadow-sm hover:bg-accent-400 hover:scale-[1.01] hover:shadow-glow-sm",
        outline: "border border-neutral-200 bg-transparent text-neutral-800 hover:border-primary hover:text-primary hover:bg-primary-50",
        ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
        destructive: "bg-error text-white shadow-sm hover:bg-error-600 hover:scale-[1.01]",
        success: "bg-support text-primary-900 shadow-sm hover:bg-support-400 hover:scale-[1.01]",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
