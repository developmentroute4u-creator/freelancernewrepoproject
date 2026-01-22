import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * BADGE COMPONENT - Premium Design System
 * 
 * Style:
 * - Soft pill shape
 * - Subtle backgrounds
 * - Purpose-driven colors
 */

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
    {
        variants: {
            variant: {
                success: "bg-support-100 text-support-700 border border-support-200",
                warning: "bg-warning-100 text-warning-700 border border-warning-200",
                error: "bg-error-100 text-error-700 border border-error-200",
                info: "bg-accent-100 text-accent-700 border border-accent-200",
                neutral: "bg-neutral-100 text-neutral-700 border border-neutral-200",
                primary: "bg-primary-100 text-primary-700 border border-primary-200",
                outline: "border border-neutral-300 text-neutral-700 bg-transparent",
            },
        },
        defaultVariants: {
            variant: "neutral",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
